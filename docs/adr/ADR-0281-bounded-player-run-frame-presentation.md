# ADR-0281 — Bounded Player Run-Frame Presentation

- Status: Accepted; Product Verified; Sprint 19 Freeze evidence
- Date: 2026-08-26
- Sprint: Sprint 19
- Work Order: WO-S19-002 — Bounded Player Run-Frame Presentation
- Architecture: v1.166 → v1.167

## Context

WO-S19-001 is Product Verified for Runtime-derived `idle` / `run` / `jump`
state switching and horizontal facing. Real Studio observation then measured
the next product blocker: while moving, the Player visibly keeps one static run
pose and slides through the world. This does not prove temporal multi-frame
animation.

The repository already has separate Player state-image requirements,
manifest-preserved state metadata, and a render tick. It does not have a
spritesheet contract or a general animation subsystem.

## Decision

- Keep Runtime authoritative for `presentationState` and horizontal velocity;
  Runtime does not know animation frames.
- Add the smallest provider-neutral `presentationFrame` metadata to the current
  asset requirement, generation context/request, manifest, and operation
  contracts.
- Emit exactly two independent Player `run` image requirements. The existing
  `idle`, `run`, and `jump` state contract remains intact; frame 0 preserves the
  existing run asset identity and frame 1 receives a bounded additional ID.
- Include the frame fact in generation identity and prompt constraints so the
  two requests cannot collapse into one generated visual.
- In `PixiEntityRenderer`, cycle only the Player's resolved run-frame entries at
  a fixed render-tick cadence. Keep the existing async asset replacement and
  primitive fallback behavior; an old sprite remains visible while a new frame
  texture resolves.
- If a legacy manifest has only an unframed run entry, continue selecting that
  entry without claiming temporal animation.

## Non-goals

No AnimationManager/Engine, universal animation state machine, BlendTree,
spritesheet/atlas pipeline, skeletal animation, interpolation, attack/death/
hurt states, all-entity rollout, Runtime gameplay/collision changes, image-
derived gameplay, or durable generated-asset storage.

## Consequences

The generation path produces two distinct static run images and the existing
Renderer visibly alternates between them during authoritative horizontal
movement. The implementation is intentionally Player-only and state-local;
real Studio verification confirmed temporal alternation, state transitions,
facing, gameplay continuity, and clean diagnostics.

The separately measured Platform collision defect remains outside this WO:
Player can currently pass through generated Platform geometry. It is recorded
in the Problem Register and is not promoted into Sprint 19 unless the current
Sprint product goal requires it.

## Verification

Shared, AI, Renderer, and Web targeted regressions cover frame metadata,
distinct generation identity/prompts, manifest/context propagation, tick-based
frame selection, legacy unframed fallback, and existing state/facing behavior.
Real Studio Product Verification completed on 2026-08-26 and passed: stationary
idle with no cycling; temporal alternation during sustained right and left
movement; correct mirroring; stop-to-idle with cycling stopped; jump without
run cycling; landing back to temporal run; unchanged Runtime/gameplay authority;
preserved mechanically complete platformer flow; and no new attributable
browser console errors/warnings.
