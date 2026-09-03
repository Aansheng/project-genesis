# Sprint 40 Backlog — Cross-Genre Gameplay Loop Continuity Discovery

Sprint 39 is FROZEN at v1.189 with `WO-S39-001` Code Complete = YES,
Product Verified = YES, and fresh Gap Analysis PASS. Sprint 40 discovery is
complete and generated exactly one READY work order. This backlog records the
work order only; it was not executed, no product code was changed, and Sprint
41 was not entered.

## WO-S40-001 — Generic Post-Interaction Gameplay Loop Continuity (first bounded slice)

status: **READY — discovery output; awaiting Human/CTO execution authorization**

priority: **P0 / highest-priority shared Farm and RPG continuity blocker**

architecture_before: **v1.189**

architecture_after: **TBD — no architecture change is made by discovery**

### Measured product blocker

**SUPPORTED ARCHETYPE INTERACTIONS DO NOT CONTINUE INTO A BOUNDED
MULTI-STEP GAMEPLAY LOOP**

The real Studio flows both stop after the first meaningful consequence:

```text
Farm: CreateWorld → Enter Harvest → harvested=true → stop
RPG:  CreateWorld → Enter Accept Quest → questAccepted=true → stop
```

The current shared Runtime/Rule/action seams are present, but neither
archetype has a dependent Rule, next target, objective transition, numeric
state transition, goal completion, or Player-readable continuation after its
committed property.

### Mission

Audit and, only after separate Human/CTO authorization, implement the smallest
shared generic continuation slice that makes one bounded next gameplay action
available after the existing Farm and RPG characteristic consequences. Reuse
the existing Runtime event/property/condition/action/goal seams where they
are sufficient. Preserve Runtime authority and do not invent a domain engine
before the missing generic capability is proven.

The work order must keep the first consequence intact and must make the
continuation observable in the normal Game surface and Full Observatory. The
scope is one bounded next step, not an open-ended progression framework.

### Dependencies

- Sprint 39 frozen at v1.189.
- `WO-S39-001` DONE with Code Complete = YES, Product Verified = YES.
- Fresh Sprint 39 Gap Analysis PASS.
- Real Studio Sprint 40 discovery evidence in
  `docs/project/SPRINT40_PRODUCT_GAP_DISCOVERY.md`.
- Existing generic Runtime target selection, GameplayRule matching,
  immutable World mutation, gameplay events, property state, numeric state,
  and current-session completion semantics.

### Allowed scope for a later authorized execution

- One shared post-interaction continuation primitive or composition at the
  existing input → Runtime → GameplayRule → World boundary.
- Existing `GameplayRule` conditions, including property/boolean/numeric
  comparison where already supported, and existing target selection.
- Existing `SET_ENTITY_PROPERTY`, `CHANGE_NUMERIC_STATE`,
  `COMPLETE_GOAL`, `REMOVE_ENTITY`, or `SPAWN_ENTITY` only if the audited
  bounded slice genuinely requires them.
- One Farm next action and one RPG next action that demonstrate the same
  generic capability, with explicit evidence if their target/state mapping
  differs.
- Player-readable next objective/target/state feedback derived from
  committed Runtime truth.
- Tests and Observatory evidence for commit, no-target, repeat/idempotency,
  authority, and existing Platformer/Survival regressions.

### Required acceptance for later execution

1. `做一个农场游戏` reaches the existing Harvest consequence, then exposes
   exactly one bounded, meaningful next Farm action through the production
   Runtime path; the next state is committed and Player-readable.
2. `创建一个 RPG` reaches the existing quest-accept consequence, then exposes
   exactly one bounded, meaningful next RPG action through the production
   Runtime path; the next state is committed and Player-readable.
3. Farm and RPG share the same generic continuation capability rather than
   requiring separate Farm/RPG runtime systems, unless source evidence proves
   the shared hypothesis false and Human/CTO reauthorizes the scope.
4. The existing `harvested=true` and `questAccepted=true` consequences remain
   authoritative and visible; no-target and repeated input remain truthful
   no-ops.
5. The continuation does not call a Provider at Runtime, add a second input
   authority, or rely on a fake UI-only state.
6. Deterministic Farm/RPG baselines, Provider candidate-only behavior,
   Platformer/Survival controls, Full Observatory truth, quality gates, and
   browser diagnostics remain clean.

### Explicit non-goals

Do not preselect or introduce `InventorySystem`, `ResourceSystem`,
`QuestEngine`, `ObjectiveManager`, `DialogueEngine`, `FarmRuntime`,
`RPGRuntime`, a multi-stage progression framework, a Farm/RPG engine, a
Provider completeness repair, an entity-count gate, a spatial redesign, a
Renderer-only continuation, a universal interaction ontology, a new input
authority, or legacy-path reconnection.

Do not expand this item into open-ended resource, inventory, economy, dialogue,
combat, quest, or progression architecture. Do not create a second Sprint 40
WO or enter Sprint 41.

### Execution boundary

This item is **READY only**. Sprint 40 discovery is complete at architecture
v1.189. Human/CTO must separately authorize execution; no implementation,
test run for a new WO, architecture advance, or Sprint 41 entry is permitted
from the current discovery continuation.
