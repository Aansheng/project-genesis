# ADR-0266 — Enemy Stomp Gameplay Rule Vertical Slice

- Status: Accepted
- Date: 2026-08-21
- Architecture: v1.151 → v1.152
- Work order: WO-S15-005

## Context

The S15-004 rule slice can remove an item after a truthful contact fact, but a
normal platformer still lacks one mechanically complete event-driven scenario.
The approved product boundary is enemy stomp: a player contacting an enemy
from above should defeat the enemy and bounce without resetting the Runtime,
camera, or Renderer session.

The Runtime already owns Position, collision-bounds, Velocity, immutable world
mutation, gravity, vertical motion, and the post-system GameplayRule phase.
The missing capability must use those existing boundaries and must not turn a
platformer example into a genre-specific Runtime.

## Decision

Extend the shared `ENTITY_CONTACT_STARTED` fact with a required typed
`direction` (`top`, `bottom`, `left`, or `right`). `DefaultEntityContactSystem`
derives it from Runtime-owned AABB geometry: previous bounds are used to detect
which side crossed into the target, with deterministic current-overlap geometry
as the first-contact fallback. Renderer dimensions, Pixi objects, textures,
and pixels are not consulted.

Make `CONTACT_DIRECTION_EQUALS` executable for the contact fact. The existing
generic enemy-stomp RuleSet entry is the supported rule:

1. `REMOVE_ENTITY(eventTarget)`
2. `APPLY_VELOCITY(eventActor, { y: -12, mode: 'set' })`

`APPLY_VELOCITY` is a generic trusted Runtime action. It reuses the existing
Velocity component and immutable `WorldMutator.replaceEntity`; it is not a
stomp-specific primitive or system. `set` and `add` modes are deterministic,
unspecified axes retain their current values, and a missing Velocity component
starts at zero.

Multi-action rules use the smallest deterministic rule-level execution
semantics: actions run against staged immutable Worlds in declared order. The
final staged World is committed only when every action executes successfully.
If a later action fails or is unsupported, the original rule-start World is
returned, earlier successful action results are marked `rolled_back` and lose
their mutation evidence, the failing action remains truthful, and the rule is
reported `execution_failed` with `committed: false`. This is not a general
transaction framework and failed event/rule pairs remain exactly-once consumed.

## Boundaries

- Gameplay remains driven by `GameplayRuleSet`, matcher, condition evaluator,
  and trusted action executor.
- No Mario-specific Runtime, `EnemyStompSystem`, enemy AI, damage, health,
  goals, score, XP, timers, spawners, question blocks, or arbitrary code is
  added.
- Deferred damage rules remain whole-rule gated and cannot be displayed as
  executed.
- Stale RuleSets, world/session bindings, and semantic revision guards remain
  authoritative; World A facts cannot mutate World B.
- The existing Runtime loop, camera controller, world store, and Renderer
  synchronization path remain continuous. No full rebuild is introduced.
- The Renderer publishes the committed Runtime World to its sink before
  gameplay observers project diagnostics, so Runtime Observatory entity lists
  cannot lag one tick behind a committed removal.
- Capability promotion for `enemy-contact` requires the validated player/enemy
  top-contact interaction shape; a provider cannot promote an arbitrary
  same-concept interaction by label alone.
- Rule results and raw GameplayEvent facts remain separate Observatory
  surfaces; action status and contact direction are surfaced as truthful
  diagnostic text.

## Consequences

The production platformer can demonstrate a complete contact → rule → mutation
→ bounce path while retaining generic Runtime ownership. The same velocity
primitive is available to future validated generic rules, but no future action
is promoted by this ADR. A failed second action cannot leave a removed enemy
behind, and the bounded execution result makes that outcome observable.

## Verification

- Runtime tests cover Runtime geometry direction, top/non-top condition
  evaluation, two-action stomp execution, exactly-once consumption, rollback,
  and stale/world isolation.
- Shared/AI tests cover typed immutable contracts and capability-derived support
  truth; damage remains deferred.
- Web tests cover truthful direction/action Observatory projection and the
  active platformer RuleSet.
- TypeScript, ESLint, affected regression suites, and the web build pass.
- Local Studio browser evidence covers real platformer creation, top contact,
  rule match and conditions, both committed actions, Runtime/Renderer enemy
  removal, player bounce/re-land/control continuity, no camera reset or world
  rebuild, exactly-once behavior, stale isolation, deferred damage truth, and
  clean browser errors/warnings.
