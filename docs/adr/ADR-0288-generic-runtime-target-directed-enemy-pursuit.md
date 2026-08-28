# ADR-0288 — Generic Runtime Target-Directed Enemy Pursuit

- Status: Accepted; Product Verified; Sprint 28 Freeze Review selected
- Date: 2026-08-28
- Work Order: WO-S28-001
- Architecture: v1.177 → v1.178

## Context

Sprint 28 measured the smallest missing capability in the Survival pressure
loop: generated enemies had Runtime Position, collision, and Health, but no
authoritative behavior that approached the current Player. The existing
contact-start event, Survival damage rule, Health mutation, failed state, and
same-session Respawn were already reusable. Platformer behavior was a
compatibility boundary and could not inherit enemy pursuit.

Human/CTO product verification later identified a second bounded integration
gap: same-world Survival enemy additions received the pursuit composition but
did not visibly reuse the first generated Enemy artwork. That is an asset
binding issue at the existing Web visual-evolution boundary, not a reason to
move visual or gameplay authority into Runtime.

## Decision

Add one generic data-driven Runtime behavior component:

`TargetDirectedMovementComponent { targetEntityId: string; speed: number }`

Survival semantic-to-DSL composition attaches this component to each eligible
Enemy with the current Player ID. The same composition is applied by the
existing `RuntimeWorldEvolutionSynchronizer` when adding enemies to a live
Survival world. The component carries identity and configuration only; it is
not an AI model or a frame callback.

`DefaultTargetDirectedMovementSystem` runs before
`DefaultVelocityMotionSystem`. It reads the source and target Position
components, computes a direct normalized vector, clamps the step to the
remaining distance, and writes finite Velocity. Missing/zero-position,
missing-target, and invalid-speed cases safely stop movement without
NaN/Infinity. `DefaultVelocityMotionSystem` integrates finite Velocity into
Position for any eligible entity and keeps legacy scalar coordinates aligned.

The Web Studio composition selects the generic systems for the existing
top-down Survival profile. Runtime systems do not branch on `worldType` and
the Platformer registry remains PlayerController → Jump → Gravity → Vertical
Motion → GroundCollision → EntityContact.

For same-world visual evolution, Survival Enemy additions inherit the current
Enemy visual identity. `buildTargetedAssetManifest` copies a resolved resource
from an existing member of the same visual-generation group to new binding
requirements, preserving each new entity/asset ID while avoiding duplicate
generation. The Renderer remains the consumer of the manifest and does not
choose pursuit or target identity.

## Authority and ordering

The authoritative chain is:

`Semantic World → Game DSL → Runtime target identity → Runtime Position lookup
→ target-directed Velocity → generic Position integration → collision/contact
event → existing Survival DAMAGE_ENTITY rule → Health/session state → Renderer`

AI/provider output remains a candidate for semantic meaning and visual
generation. It does not control per-frame movement. Contact damage remains
the existing `ENTITY_CONTACT_STARTED` behavior: a persistent overlap emits one
start fact until the entities separate, so one observed Health decrease is
expected and no continuous attack mechanic is introduced.

## Consequences and non-goals

- Initial and conversationally added Survival enemies have one deterministic
  pursuit contract and update direction from the current Player Position.
- Diagonal speed is normalized; pursuit is bounded by the target distance and
  safe for malformed or missing runtime data.
- Existing enemy visual resources can be reused by same-role Survival
  additions without a new generation job or a world rebuild.
- Platformer movement, Jump, collision, composition, and visual behavior are
  unchanged.
- This ADR does not add enemy AI, attacks, continuous damage, weapons,
  projectiles, pathfinding, steering, spawn/wave systems, timers, progression,
  a Survivor-specific Runtime, or a new Renderer architecture.

## Verification

Automated Runtime, Shared, AI, Web composition, visual planner/executor, and
World Evolution integration tests pass. Web full tests, TypeScript, ESLint
(zero errors), and production build pass. The final clean provider-backed
Studio session preserved `world-1`, changed 4 entities to 9 with exactly five
new Enemies, confirmed target-directed following after real Player input, and
recorded binding-only visual execution with no new generation operation. The
final Diff reported semantic, Runtime, asset, and visual synchronization
complete; the browser console was clean. The full Observatory does not expose
per-entity canonical IDs or resource URLs, so the available binding-only and
no-duplicate-generation evidence is recorded without inventing those values.
Product Verified = YES. `SPRINT28_FREEZE_REVIEW` is selected.
