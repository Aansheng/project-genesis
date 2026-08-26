# ADR-0280 — Player Horizontal Motion Truth Reachability Repair

- Status: Accepted bounded repair; Product Verification Pending
- Date: 2026-08-25
- Sprint: Sprint 19
- Work Order: WO-S19-001 — Runtime-Derived Player Presentation State Assets
- Architecture: v1.165 → v1.166

## Context

WO-S19-001 derived Player presentation from `VelocityComponent`, but the active
Studio Runtime path used `DefaultPlayerControllerSystem` to mutate Position.x
directly. The registered `VerticalMotionSystem` therefore moved the Player
without producing horizontal velocity truth. `run` and left-facing mirroring
were consequently unreachable from normal input, even though isolated adapter
tests passed with manually injected velocity.

## Decision

- Treat `VelocityComponent.x` as the authoritative horizontal motion truth,
  consistent with the existing two-axis motion integration, gravity preservation,
  jump preservation, ground collision behavior, and `APPLY_VELOCITY` contract.
- Make `DefaultPlayerControllerSystem` write the current horizontal input to
  `VelocityComponent.x`; the existing `DefaultVerticalMotionSystem` integrates
  that value into Position.x.
- Explicitly write horizontal zero when input is released so Renderer state
  returns from `run`/facing to `idle`/neutral.
- Preserve existing vertical-arrow position behavior and vertical physics.
- Add a real registered Runtime-system-chain regression through input, Runtime
  tick, world state, `DefaultRuntimeRendererAdapter`, and RenderEntity state.
- Record product capability reachability as a Supervisor acceptance principle:
  downstream state injection alone cannot prove an upstream production path.

## Non-goals

No input bridge, Renderer inference, movement manager, animation framework,
state-machine framework, spritesheet, multi-frame animation, collision geometry,
or legacy-path reconnection is introduced.

## Consequences

The active Studio chain can now reach `idle → run → idle`, left-facing run,
`jump` while moving, and `jump → run` on landing from real input. The Player
still uses static presentation-state images; temporal run animation remains a
separate measured product question.

## Verification

Automated Runtime and Web reachability tests pass with real input and registered
systems rather than injected velocity. Real Studio Product Verification passed
on 2026-08-26 for visible idle/run/stop/facing/jump/landing, gameplay
continuity, and clean browser diagnostics. Temporal multi-frame run animation
remains a separate measured gap and is covered by WO-S19-002.
