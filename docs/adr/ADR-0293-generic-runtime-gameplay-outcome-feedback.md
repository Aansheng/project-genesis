# ADR-0293 — Generic Runtime Gameplay Outcome Feedback

- Status: Accepted by execution of `WO-S33-001`
- Date: 2026-09-01
- Architecture transition: v1.182 → v1.183

## Context

Sprint 33 Product Gap Discovery found that the generated Survival loop had a
working explicit `Space` attack, authoritative damage/defeat/replacement, and
truthful Observatory facts, but the normal Game canvas was silent. A Player
had to open Inspector or Observatory to understand whether an attack damaged
an Enemy, defeated it, or caused a replacement.

The existing Runtime already exposes the required committed action results:
`HEALTH_UPDATED` includes the actual damage amount, lethal `ENTITY_REMOVED`
retains the Health result, and committed `ENTITY_ADDED` exposes the new
Runtime entity. Runtime Position snapshots are available before and after
each action. No new gameplay fact or authority is required.

## Decision

Add a generic Runtime-result-to-Game presentation projection in the existing
Runtime visualization loop:

1. A committed, executed `HEALTH_UPDATED` mutation produces a transient `hit`
   outcome bound to the mutated Runtime entity ID. Its position comes from the
   authoritative post-action World, with the pre-action World as a safe
   fallback, and its finite positive `damageAmount` is retained when exposed.
2. A committed, executed `ENTITY_REMOVED` mutation produces a transient
   `defeat` outcome only when the authoritative removal Health is exactly zero.
   Its position is read from the pre-action World because the dead entity is no
   longer retained in the Runtime World.
3. A committed, executed `ENTITY_ADDED` mutation produces a transient `spawn`
   outcome at the new entity's authoritative post-action position.
4. Failed, rolled-back, unsupported, non-lethal removal, attack-request-only,
   and missing-position results produce no positive visual outcome.

The `DefaultRuntimeVisualizationLoop` publishes projected outcomes only after
storing the new authoritative Runtime World and before the existing observers
read it. `DefaultPixiEntityRenderer` presents the outcomes in a dedicated
feedback layer using small primitive rings, a defeat cross, a replacement
arrival ring, and an optional authoritative damage label. Presentation clocks
and bounded lifetimes are renderer-local; they do not drive Runtime ticks,
Health, targeting, replacement, progression, or session state.

Feedback identity is `(feedbackId, entityId, sourceEventId)`. It never uses a
visual asset, texture, or entity type as state identity, so entities sharing a
canonical Enemy visual cannot share or leak feedback state. The Web Game
Viewport clears the presentation layer when the active world changes and
keeps the existing Platformer composition intact.

## Boundaries

Runtime remains the sole gameplay authority. Renderer/Pixi only projects
committed Runtime outcomes. This decision adds no damage or targeting logic,
new event vocabulary, combat manager, weapon, projectile, cooldown, timer,
wave/spawn director, progression redesign, HUD, attack animation framework,
sound, provider call, image-generation call, or persistence.

## Production flow

`Space edge → existing Runtime event/rule/World mutation → committed action
result → Runtime outcome projector → existing Game Viewport/Pixi feedback
layer`

`ENTITY_ATTACK_REQUESTED` remains an intent fact, not a successful-hit cue.
Observatory continues to project the same Runtime event/rule/world truth.

## Verification

Focused and full Runtime/Renderer/Web suites cover committed hit, damage
amount, lethal removal position preservation, replacement addition, no-op and
failed outcomes, Player damage, renderer lifetimes/cleanup, production
reachability, and shared-identity isolation. Runtime 708/708, Renderer
510/510, and Web 3573/3573 tests pass. Runtime, Renderer, and Web TypeScript
checks pass; package ESLint exits with no errors and only existing warnings;
the Web production build and `git diff --check` pass.

Real Studio verification with `生成一个幸存者游戏` showed the hit label/ring,
the defeat cross/ring, a Runtime replacement, and the same hit feedback on the
replacement. Full Observatory retained `world-1`, current gameplay event
stream, XP/Level, and `v1.183 / Sprint 33`; the Platformer smoke retained
seven entities and `Space — 跳跃`. Browser warning/error diagnostics were
empty. Fresh Sprint 33 Gap Analysis passes the product success question; the
next gate is `SPRINT33_FREEZE_REVIEW`, and Sprint 34 is not entered.
