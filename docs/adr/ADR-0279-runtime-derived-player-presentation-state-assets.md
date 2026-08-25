# ADR-0279 — Runtime-Derived Player Presentation State Assets

- Status: Accepted; Product Verification Pending
- Date: 2026-08-25
- Sprint: Sprint 19
- Work Order: WO-S19-001 — Runtime-Derived Player Presentation State Assets
- Architecture: v1.164 → v1.165

## Context

The Player asset specification already declares bounded `idle`, `run`, and
`jump` presentation states, but the existing generation identity grouped those
requirements into one entity visual. The Runtime also already owns the facts
needed to select a presentation: authoritative velocity and grounded behavior.
The missing capability was the wiring between those existing contracts.

The real Studio path must not give AI or image pixels authority over movement,
collision, or gameplay state. Separate static pose images are sufficient for
this proof; they are not true multi-frame animation.

## Decision

- Include `presentationState` in visual generation identity so Player idle,
  run, and jump become independent provider requests.
- Preserve `presentationState` and `renderUsage` through generation context,
  targeted manifest bindings, and image-generation requests.
- Derive Player presentation state in the Runtime → Renderer adapter from
  authoritative velocity: non-zero vertical velocity is `jump`, otherwise
  non-zero horizontal velocity is `run`, otherwise `idle`.
- Select the manifest entry by entity ID and presentation state, falling back
  to the state-less entity entry for backward compatibility.
- Mirror the generated Player sprite when authoritative horizontal velocity is
  negative.
- Keep the Runtime, collision systems, gameplay rules, and asset identity
  boundaries unchanged. Do not introduce an animation manager, spritesheet
  pipeline, universal state machine, or image-derived gameplay.

## Consequences

- Equivalent entities can still share one generated URI, while distinct Player
  presentation states no longer collapse into one request.
- Static generated poses can switch deterministically as Runtime state changes.
- The renderer keeps primitive fallback visuals and rejects stale views while
  allowing an async state asset to apply after a later render tick.
- Temporal animation remains a separate, unproven product gap.

## Verification

Automated tests and type/build checks pass. Real Studio verification observed
separate Codex CLI requests and a generated/applied Player idle asset; the run
and jump assets were published into the manifest but remained renderer-pending
because the in-app browser keyboard bridge did not deliver subsequent Runtime
input during the final verification attempt. Therefore the WO remains
Product Verification Pending and no WO-S19-002 is generated.
