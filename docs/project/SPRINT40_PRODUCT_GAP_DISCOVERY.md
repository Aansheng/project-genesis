# Sprint 40 Product Gap Discovery — Cross-Genre Gameplay Loop Continuity

Date: 2026-09-03  
Architecture at discovery boundary: **v1.189**  
Sprint 39 disposition: **FROZEN — WO-S39-001 Code Complete = YES; Product Verified = YES; fresh Gap Analysis PASS**  
Discovery status: **DONE — exactly one READY WO generated; no product code modified; no WO executed; Sprint 41 not entered**

## Decision boundary

Human/CTO froze Sprint 39 at v1.189 and authorized this Sprint 40 discovery
only. The discovery uses the real Genesis Studio front door and records the
first production break after the v1.189 characteristic interaction
consequence. It does not implement a follow-up mechanic or advance the
architecture version.

The product UI metadata still presents `v1.189 / Sprint 39`. That is expected
for this discovery-only pass: changing product metadata would be a product
code change. The engineering control plane records Sprint 39 as frozen and
Sprint 40 as the active discovery boundary.

## Real production trace

```text
natural-language CreateWorld
  → StudioCommandBar / gameStore.send
  → IntentRouter / CreateWorld boundary
  → Provider candidate or deterministic fallback
  → Semantic World
  → Game DSL
  → Runtime projection
  → registered Studio Runtime systems
  → current explicit interaction
  → ENTITY_INTERACTION_REQUESTED
  → archetype GameplayRule
  → committed SET_ENTITY_PROPERTY mutation
  → gameplay-state on the target entity
  → [no downstream GameplayRule / target / objective / state transition]
```

The shared first post-interaction seam is therefore real and authoritative;
the missing capability is what consumes the committed consequence and makes a
bounded next step available.

## Farm — `做一个农场游戏`

The real Studio request resolved through the existing deterministic Farm path
to the 8-entity baseline. Explorer and Full Observatory exposed the existing
Farm composition, including the Player, field-like terrain, another field
target, storage/barn-style entities, NPC content, and a quest entity.

After normal movement into the eligible terrain target's interaction range and
the current `Enter — 交互` Harvest interaction:

- Runtime emitted one `ENTITY_INTERACTION_REQUESTED` for the Player and the
  selected terrain target.
- The only Gameplay Rule was the supported `farm-interaction` rule.
- That Rule committed two `SET_ENTITY_PROPERTY` actions:
  `activated=true` and `harvested=true`.
- Runtime Entity Inspector showed the immutable target state
  `{"activated":true,"harvested":true}`.
- Full Observatory continued to show the generic primary objective
  “Perform farm activities and interact with the world.”
- XP remained `0` and Level remained `1`; no goal completion, numeric state,
  new entity, or next target was produced.
- The execution-graph panel reported no live execution graph; the retired
  static topology is not a substitute for a downstream gameplay transition.
- A follow-up Enter check produced no additional positive Farm consequence or
  new visible phase. The existing repeat/no-op truth remains the behavior
  covered by the v1.189 regression path.

The Farm world contains possible objects a player could plausibly approach
next, but the current rule set does not distinguish “harvest completed” from
the start of another bounded Farm step. Any next interaction would be the
same generic interaction path, not a new Harvest consequence, objective, or
state transition.

## RPG — `创建一个 RPG`

The real Studio request produced the 9-entity deterministic fallback after an
invalid Provider candidate. The world contained `quest-giver` at
`(512,384)`, a separate `main-quest` at `(800,384)`, Player/NPC content,
enemies, and the existing world/terrain composition.

After normal ArrowRight movement, Player was at `(491,400)` and the current
`quest-giver` was at `(512,384)`, a Runtime-reported interaction distance of
`26.400757564888174`. The current Enter interaction then produced:

- one `ENTITY_INTERACTION_REQUESTED` for `player → quest-giver`;
- the only Gameplay Rule, supported `rpg-interaction`;
- two committed `SET_ENTITY_PROPERTY` actions;
- target state `{"activated":true,"questAccepted":true}` in Runtime Entity
  Inspector;
- Full Observatory primary objective “Explore the world and interact with
  its quest characters.”;
- exactly one supported RPG Rule, with no second Rule, objective update,
  completion, numeric state, or target transition;
- XP `0` and Level `1`.

The separate `main-quest` target was inspected in Runtime at `(800,384)` and
had only position, semantic, and collision components before any follow-up
state. Player was moved to `(809,400)` and the visible Enter attempt did not
produce a second interaction event or state mutation; the event stream
remained the single committed `quest-giver` chain (apart from ordinary
contact facts). Regardless of that input-edge detail, the authoritative rule
and objective inspection show no post-accept consumer that could turn
`questAccepted=true` into a distinct next step. The second quest entity is a
potential target, not a Player-readable or mechanically defined continuation.

## Generic primitive audit

| Primitive | Current capability | Sprint 40 finding |
| --- | --- | --- |
| GameplayRule conditions | Category, ID, component, boolean, numeric, and event-payload comparison primitives exist. | They match the current interaction actor/target; no Farm/RPG Rule is triggered by the committed `harvested` or `questAccepted` property. |
| Entity properties | Typed `gameplay-state` supports `activated`, `harvested`, and `questAccepted` among the existing allowed properties. | The first consequence is stored authoritatively, but no current consumer reads it to select a next step. |
| Numeric game state | Generic finite additive `CHANGE_NUMERIC_STATE` exists; the active baseline is XP `0`, Level `1`. | Farm and RPG do not write numeric state in the current interaction. |
| `NUMBER_COMPARE` | Supported for numeric state/entity/event-payload conditions; existing Survival rules use threshold comparison. | It is an available generic gate, not an active Farm/RPG continuation. |
| Gameplay events | Runtime emits interaction, contact, add/remove, landing, and other bounded facts. | The first interaction event exists; no post-property Farm/RPG domain event is emitted to drive a next rule. |
| `SET_ENTITY_PROPERTY` | Trusted immutable action commits the v1.189 characteristic consequence. | It is the end of both current archetype chains, not a continuation trigger. |
| `REMOVE_ENTITY` / `SPAWN_ENTITY` | Generic supported actions exist, including a removal-triggered spawn slice elsewhere. | Neither Farm nor RPG current rules uses them; their existence does not create a loop automatically. |
| XP / Level | Runtime session state owns XP/Level and the generic numeric path is active in bounded Survival progression. | Both Farm and RPG remain XP `0` / Level `1` after the characteristic interaction. |
| Goals / completion | `COMPLETE_GOAL` is a supported current-session completion action. | Farm's quest entity and RPG's `main-quest` entity are not connected to goal completion or quest progression in the current Rule set. |

The audit found no need to preselect an inventory, resource, quest, dialogue,
or genre runtime system. The missing behavior is the generic continuation
consumer at the existing event/property/Rule/action boundary.

## Secondary observations

### Provider Farm composition

The earlier v1.189 Product Verification captured a Provider-accepted Farm
candidate with 5 entities versus the deterministic 8-entity Farm baseline.
This can become material if a future second step requires a particular field,
storage, or quest topology, but it does not explain the current first break:
the deterministic world already contains multiple plausible follow-up
objects, and neither Farm nor RPG has a downstream continuation Rule. The
Provider remains candidate-only; no entity-count gate or Provider repair is
authorized by this discovery.

### Spatial and control composition

Farm and RPG still use the inherited side-view movement composition and show
`Space — Jump` alongside Arrow Keys and Enter. Reaching distant content is a
user-visible friction, and the RPG probe generated ordinary contact facts
while traversing the world. It is secondary here because both current
characteristic interactions are reachable and commit correctly. The first
production break occurs immediately after the commit, where no meaningful
next action is defined.

### Player-readable next state

The committed first state is inspectable in Runtime/Observatory and is
transiently labelled `Harvested` or `Quest accepted` on the Game surface.
There is no Player-readable next objective, available target instruction, or
phase/state cue after that label. This is a contributing presentation gap,
but it is downstream of the more fundamental absence of a mechanically
defined continuation state.

## First production break and shared capability

The first production break is:

> **SUPPORTED ARCHETYPE INTERACTIONS DO NOT CONTINUE INTO A BOUNDED
> MULTI-STEP GAMEPLAY LOOP**

Farm and RPG share the same missing generic capability. Their current chains
are structurally identical through the first committed property mutation:

```text
interaction request
  → one archetype Rule
  → two property writes
  → authoritative gameplay-state
  → no dependent Rule / target / objective / numeric or goal transition
```

The shared capability to address later is a bounded post-interaction
continuation that consumes the committed consequence (or a canonical event
for it), evaluates an existing generic condition, and exposes exactly one
meaningful next action/target/objective/state transition through the existing
Runtime authority. This is a capability statement, not a preselected class or
genre architecture.

## Priority decision

Exactly one blocker is selected:

1. **Selected — missing bounded post-interaction loop continuity.** It is the
   earliest failure shared by Farm and RPG and is visible immediately after
   both verified first interactions.
2. **Provider composition variance — lower priority.** It is real and should
   remain candidate-only, but the deterministic baseline already proves that
   the missing continuation is not caused by entity count.
3. **Spatial/control composition — lower priority.** It adds travel friction,
   but both first interactions are reachable and authoritative.
4. **Next-state readability — lower priority as a standalone item.** It is
   important for Player experience, but there is no defined next state to
   render yet.

## Exactly one READY work order

`WO-S40-001 — Generic Post-Interaction Gameplay Loop Continuity (first bounded slice)`

Status: **READY — generated by discovery; not authorized for execution in
this pass**.

The detailed one-item backlog is recorded in
`docs/project/SPRINT40_BACKLOG.md`. It is limited to the smallest shared
generic continuation slice and explicitly forbids preselecting
`InventorySystem`, `ResourceSystem`, `QuestEngine`, `ObjectiveManager`,
`DialogueEngine`, `FarmRuntime`, `RPGRuntime`, or a multi-stage progression
framework.

## Stop boundary

Sprint 40 discovery is complete at one READY work order. No product code was
modified, no new WO was executed, the product architecture remains v1.189,
and Sprint 41 was not entered. The next action is Human/CTO review of
`WO-S40-001`; do not execute it or cross into Sprint 41 from this discovery
boundary.
