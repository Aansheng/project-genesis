# Sprint 42 — World Evolution Gameplay Rule Binding Continuity Discovery

Date: 2026-09-04

Architecture at discovery boundary: **v1.191**

Sprint 41 disposition: **FROZEN — `WO-S41-001` Code Complete = YES;
Product Verified = YES; fresh Gap Analysis PASS**

Sprint 41 Git checkpoint: **`2d595ff` — Implement WO-S41-001 archetype-native
evolution recovery**. The preserved v1.190 checkpoint is **`04c3090`**.

Discovery status: **COMPLETE — exactly one Product blocker and exactly one
READY WO generated; no product code modified; no WO executed; Sprint 43 not
entered.** Architecture remains v1.191.

## Evidence boundary

This discovery was authorized as Discovery only. The Farm, RPG, and Survival
production traces below are real Genesis Studio front-door observations from
the v1.191 run captured in the Sprint 41 execution record. They are reused here
because the repository remained at v1.191 and no product code changed between
the two discovery boundaries. A new in-app Browser tab was attempted for a
fresh confirmation, but the local `localhost:5888` navigation was rejected by
the Browser security policy. No alternate browser, raw CDP path, or URL
workaround was used. The report therefore does not claim a new browser run in
this turn; it records the existing real Studio evidence and the current source
contracts/tests that explain it.

The source of truth remains the production wiring, not a rule description:

```text
StudioCommandBar
  → gameStore.send
  → CreateWorld or World Evolution route
  → semantic World / semantic delta
  → GameplaySpecification / GameplayRuleSet
  → Runtime projection or Runtime evolution synchronizer
  → registered Runtime systems
  → finalized GameplayEvent
  → GameplayRule matcher/evaluator/executor
  → committed Runtime state and Observatory/Game projection
```

## 1. Farm baseline and evolution

### Baseline

Natural-language CreateWorld command:

```text
做一个农场游戏
```

The deterministic v1.191 Farm baseline in real Studio was **world-5** with
eight semantic/Runtime entities:

```text
player, merchant, farmer, barn, wheat-field, corn-field, storage,
harvest-quest
```

Runtime was Live, Gameplay was active, and the normal control was `Enter —
交互` plus Arrow Keys. The accepted v1.190 Farm two-step baseline was also
reproduced before the evolution check:

1. `wheat-field` accepted Enter and committed
   `activated=true, harvested=true`.
2. A separate interaction with `harvest-quest` committed
   `questCompleted=true` after the harvested prerequisite.
3. Repeating the second interaction was a truthful no-op.

### Exact evolution command and result

The exact World Evolution command was:

```text
再加一块麦田
```

Observed result:

- route remained **World Evolution**;
- world ID remained **world-5**;
- semantic revision advanced by one;
- one semantic entity `wheat-field-1` was added;
- its semantic facts were `category=terrain`, `name=Wheat Field`;
- its Runtime type was `terrain`, with an independent Runtime ID, Position,
  semantic component, and collision bounds;
- the visual was present through the normal evolution visual path;
- the existing Farm state was retained;
- normal Player movement and Enter reached the new field;
- `farm-interaction` committed `activated=true, harvested=true` on
  `wheat-field-1`.

**Critical answer: the NEW evolved field can be harvested.** It is not being
counted merely because it appears: a real Enter event reached its Runtime ID
and a committed `harvested=true` mutation was observed.

## 2. RPG baseline and evolution

### Baseline

Natural-language CreateWorld command:

```text
创建一个 RPG
```

The deterministic v1.191 RPG baseline in real Studio was **world-6** with
nine semantic/Runtime entities:

```text
player, villager, merchant, quest-giver, enemy, boss, town, forest,
main-quest
```

Runtime was Live, Gameplay was active, and the normal control was `Enter —
交互` plus Arrow Keys. The accepted RPG two-step baseline was verified before
evolution:

1. Enter on `main-quest` before the prerequisite returned
   `conditions_failed / not-committed`.
2. Enter on `quest-giver` committed
   `activated=true, questAccepted=true`.
3. A separate Enter on `main-quest` committed
   `questCompleted=true`.
4. Repeating completion was a truthful no-op.

### Exact evolution command and result

The exact World Evolution command was:

```text
再加一个任务
```

Observed result:

- route was **World Evolution**;
- world ID remained **world-6**;
- existing `quest-giver.questAccepted=true` remained in Runtime state;
- one semantic entity `quest-1` was added;
- its semantic facts were `category=quest`, `name=Quest`;
- its Runtime type was `quest`, with independent Position, semantic component,
  and collision bounds;
- the visual/static fallback was present;
- the normal Player interaction system reached `quest-1` at distance `16`;
- the event was emitted, but no RPG consequence committed.

The exact Observatory trace was:

```text
ENTITY_INTERACTION_REQUESTED · player → quest-1 · distance=16
Gameplay Rule rpg-complete-main-quest · conditions_failed · not-committed
Gameplay Rule rpg-interaction · conditions_failed · not-committed
```

The order shown by the Observatory is not the condition order. The first
condition-level divergence for the characteristic accept rule is recorded in
section 5 below.

**Critical answer: the evolved RPG quest is visible, semantic/Runtime-present,
and Enter-reachable, but it is not consequence-reachable.** It is not valid to
call it gameplay-capable based on appearance or event emission alone.

## 3. Survival control

Commands:

```text
生成一个幸存者游戏
再加五只怪
```

The real Studio control run was **world-4**:

- the world ID remained the same;
- the baseline six entities became eleven;
- exactly `enemy-1` through `enemy-5` were added;
- each evolved Enemy received target-directed movement toward the current
  Player;
- the new Enemies pursued/converged on Player;
- contact events were emitted after convergence;
- `survival-enemy-contact` committed `DAMAGE_ENTITY` against Player;
- the canonical Enemy visual was reused and rebound without per-entity asset
  generation.

Survival is the positive control. The new entities are not only visible: they
participate in pursuit and committed combat/damage behavior.

## 4. CreateWorld versus World Evolution

| Concern | CreateWorld | World Evolution |
| --- | --- | --- |
| Front door | Natural-language command allocates/replaces a new world | Natural-language mutation carries the active world ID |
| Semantic input | Full semantic world from the selected template/provider candidate | Validated semantic delta against the current semantic world |
| Runtime | Full projection composes the initial Runtime entities | `DefaultRuntimeWorldEvolutionSynchronizer` adds/removes/replaces affected entities only |
| Gameplay composition | `DefaultGameplaySpecificationBuilder` and `DefaultGameplayRuleBuilder` compose the initial rules from the full entity set | `DefaultGameplayRuleReconciler` validates/rebuilds current known rules against the delta; it does not synthesize a rule for every new entity |
| Identity/state | New session/world state is initialized | Same world/session and untouched Runtime components are retained |
| Visuals | Initial visual design/manifest is created | Visual delta is planned/executed against the current manifest |

The relevant World Evolution path in `apps/web/src/stores/gameStore.ts` is:

```text
semantic delta
  → GameplayRule reconciliation
  → Runtime World Evolution synchronization
  → visual evolution
```

For the RPG mutation, reconciliation completed and rebuilt the two known
deterministic RPG rules. It did not fail closed, duplicate the initial rules,
or add a third rule for `quest-1`. The rebuilt rules remained semantically
bound to `Quest Giver` and `Main Quest`.

This is the architectural difference that matters: CreateWorld composes a
complete initial participant set, while World Evolution composes the semantic
delta and reconciles known rules. The current reconciliation contract does not
turn a new semantic `Quest` into a new gameplay participant without an
explicit semantic capability/role fact.

## 5. Exact RPG rule and first condition-level failure

### Emitted event

The normal Runtime interaction system uses `Enter`, a finite range of `48`,
explicit RPG target category `quest`, nearest-target selection, and stable ID
tie-breaking. For the evolved target the event facts were:

```json
{
  "type": "ENTITY_INTERACTION_REQUESTED",
  "actorEntityId": "player",
  "targetEntityId": "quest-1",
  "payload": {
    "inputKey": "Enter",
    "targetCategory": "quest",
    "distance": 16,
    "range": 48
  }
}
```

The target facts were:

| Fact | Original target | Evolved target |
| --- | --- | --- |
| Runtime ID | `quest-giver` | `quest-1` |
| Runtime `type` | `quest` | `quest` |
| semantic category | `quest` | `quest` |
| semantic name | `Quest Giver` | `Quest` |
| independent Runtime identity | yes | yes |
| pre-existing `gameplay-state` | after accept: `questAccepted=true` | no accepted state before the failed request |
| separate role/capability field | absent | absent |

### `rpg-interaction` generated by CreateWorld

The deterministic rule is:

```text
ruleId: rpg-interaction
name: Accept RPG quest
trigger:
  eventType = ENTITY_INTERACTION_REQUESTED
  actor = eventActor
  target = eventTarget
conditionMode: all
conditions:
  1. ENTITY_CATEGORY_EQUALS(eventActor, player)
  2. ENTITY_CATEGORY_EQUALS(eventTarget, quest)
  3. ENTITY_ARCHETYPE_EQUALS(eventTarget, "Quest Giver")
actions:
  1. SET_ENTITY_PROPERTY(eventTarget, activated, true)
  2. SET_ENTITY_PROPERTY(eventTarget, questAccepted, true)
```

The original `quest-giver` passes all three conditions. `quest-1` passes the
event participant match, the `player` category condition, and the `quest`
category condition. It fails the first rejecting condition:

```text
ENTITY_ARCHETYPE_EQUALS(eventTarget, "Quest Giver")
expected normalized semantic name: quest-giver
actual normalized semantic name:   quest
reason: archetype_mismatch
```

Because the rule uses `conditionMode=all`, no action is executed and
`questAccepted=true` is not committed for `quest-1`.

### `rpg-complete-main-quest` generated by CreateWorld

The continuation rule is:

```text
ruleId: rpg-complete-main-quest
trigger: ENTITY_INTERACTION_REQUESTED(eventActor, eventTarget)
conditionMode: all
conditions:
  1. ENTITY_CATEGORY_EQUALS(eventActor, player)
  2. ENTITY_CATEGORY_EQUALS(eventTarget, quest)
  3. ENTITY_ARCHETYPE_EQUALS(eventTarget, "Main Quest")
  4. BOOLEAN_EQUALS(
       entityProperty(archetype("Quest Giver"), questAccepted),
       true
     )
action:
  SET_ENTITY_PROPERTY(eventTarget, questCompleted, true)
```

The existing accepted Quest Giver state makes condition 4 available in the
evolved-world trace, but `quest-1` still fails condition 3 because its semantic
name is `Quest`, not `Main Quest`. Therefore this rule also cannot commit.

### Binding meaning

The RPG rule is **not concrete-ID-bound**: neither rule contains
`ENTITY_ID_EQUALS` for `quest-giver` or `main-quest`. It is nevertheless
**entity-specific in effect** because it uses `eventTarget` plus an exact
semantic archetype/name (`Quest Giver` or `Main Quest`). It is not a
role/capability-wide `quest` rule.

The current `GameplaySpecification` description says that the Player can
interact with one nearby RPG quest entity, but the executable deterministic
builder deliberately resolves the designated Quest Giver by ID/name pattern
and emits the exact archetype condition. The executable meaning is therefore:

```text
accept the quest from the designated Quest Giver
```

not:

```text
accept from every entity whose category is quest
```

The available `role` selector does not solve this distinction: current
validation/execution defines `role` as a category alias, and
`GameWorldEntity` has only `id`, `category`, and `name`. There is no separate
semantic role/capability field that can distinguish Quest Giver, Main Quest,
and a newly added generic Quest.

## 6. Why Farm succeeds

Farm's deterministic interaction rule is also not ID-bound. It is:

```text
ENTITY_CATEGORY_EQUALS(eventActor, player)
ENTITY_CATEGORY_EQUALS(eventTarget, terrain)
ENTITY_ARCHETYPE_EQUALS(eventTarget, "Wheat Field")
```

The Sprint 41 semantic delta deliberately creates `wheat-field-1` with the
same semantic category and name as the existing field. Runtime resolves the
event target by the new Runtime ID, then the evaluator reads authoritative
semantic facts and compares the normalized name. The ID is independent, but
the semantic archetype is compatible, so the existing rule matches and
commits `harvested=true`.

Farm therefore proves **archetype-name equivalence for a deliberately
archetype-native addition**, not universal rule inheritance. It does not prove
that every entity in a broad category should receive the same consequence.

## 7. Why Survival succeeds

Survival uses a different, category/component-driven composition:

- `DefaultRuntimeWorldEvolutionSynchronizer` passes the current Player ID as
  `targetEntityId` for added Survival entities;
- `createComposedRuntimeEntity` gives every Survival Enemy a generic `health`
  component and `target-directed-movement` component;
- `DefaultTargetDirectedMovementSystem` and `DefaultVelocityMotionSystem` are
  generic Runtime systems;
- `survival-enemy-contact` matches Player/Enemy categories on a contact event
  and applies trusted `DAMAGE_ENTITY` to Player;
- the offensive Survival rules match the Enemy category and required Health
  component, not a fixed Enemy ID or name;
- visual reuse is an asset identity/manifest concern and does not carry
  gameplay state.

Thus every added Enemy receives the capability-relevant Runtime components and
matches the existing category-wide rules. This is not evidence that RPG's
quest category is semantically homogeneous.

## 8. Generic primitive audit

The audited primitives already exist and are production-wired:

| Primitive | Finding |
| --- | --- |
| GameplayRule conditions | Category, archetype, exact ID, component, contact direction, `NUMBER_COMPARE`, and `BOOLEAN_EQUALS` are validated/evaluated. |
| Entity properties | Typed `gameplay-state` is committed by `SET_ENTITY_PROPERTY`; later rules can read it. |
| Numeric game state | Runtime-owned finite XP/Level exists; `NUMBER_COMPARE` is used for progression-conditioned Survival damage. |
| Gameplay events | Interaction, attack, contact, add, remove, jump, and landing facts exist; events are observations, not consequences. |
| `SET_ENTITY_PROPERTY` | Trusted immutable mutation; equal writes are truthful no-ops. |
| `REMOVE_ENTITY` | Existing generic action; not involved in this divergence. |
| `SPAWN_ENTITY` | Existing bounded generic action; not involved in this divergence. |
| XP / Level | Existing current-session state; Farm/RPG evolution remained at the baseline Level 1 in the measured traces. |
| Goal/completion | Existing `COMPLETE_GOAL` session semantics and entity `questCompleted` property; no workflow engine is required for the measured failure. |

No missing condition, event, action, or Runtime mutation primitive was found.
The missing capability is at the **semantic capability-binding/composition
boundary**, before an appropriate rule can safely match the new RPG entity.

## 9. State, identity, spatial/control, and readability results

### State and identity

- Farm and RPG evolution retained the same world ID and current session.
- Farm's already harvested baseline field state remained committed after the
  add-only mutation; the new field received independent state when harvested.
- RPG's already accepted `quest-giver` state remained committed after the
  add-only mutation; the new `quest-1` had independent identity and did not
  inherit the old entity's state.
- The accepted two-step baselines had already committed Farm
  `harvest-quest.questCompleted=true` and RPG `main-quest.questCompleted=true`.
  The add-only synchronizer did not replace or remove those retained entities;
  the future repair must rerun both completed-state preservation checks in its
  acceptance sequence.
- Reconciliation did not duplicate the initial RPG rules. Its observed result
  was two known rules rebuilt against the new semantic revision, with no new
  rule for `quest-1`.
- No whole-world rebuild/reset occurred.

### Spatial/control composition

The new Farm field and RPG quest were both reachable by normal movement and
Enter. The inherited Farm/RPG side-view/control composition is still a
possible user-experience concern, but it is not the first production break:
Farm reaches and harvests the new field, and RPG reaches `quest-1` at distance
16. Survival's top-down composition remains a passing control.

### Player readability

The RPG next state is partially Player-readable in Observatory: the Player can
see the interaction request and the `conditions_failed / not-committed` rule
decision. There is no positive RPG consequence on the normal Game surface,
because no accepted state was committed. The state is therefore not hidden,
but it is not yet a meaningful gameplay result.

## 10. FIRST production divergence

The first divergence is **after** all of these stages have succeeded:

```text
World Evolution route
  → same-world semantic delta
  → Runtime entity creation
  → visual presence
  → normal Player target selection
  → ENTITY_INTERACTION_REQUESTED(player → quest-1)
```

The first condition-level divergence is:

```text
rpg-interaction
  → ENTITY_ARCHETYPE_EQUALS(eventTarget, "Quest Giver")
  → actual semantic name = "Quest"
  → archetype_mismatch
  → conditions_failed
  → no SET_ENTITY_PROPERTY(questAccepted=true)
```

The RPG failure is therefore not a provider, routing, Runtime projection,
input-range, event, action-execution, state-read, or visual failure.

## 11. Shared capability decision

Farm and RPG share the same production seam:

```text
semantic entity/delta → rule composition → event target → condition match
```

They do **not** currently share the same missing behavior:

- Farm's evolved field carries the same category/name facts that the existing
  Farm rule recognizes.
- RPG's evolved generic `Quest` does not carry a fact that says whether it is
  a Quest Giver, Main Quest, or another quest-capable role.
- Survival separately demonstrates that category-wide capabilities work when
  the Runtime composition supplies the relevant components and the rules are
  intentionally category-wide.

The smallest reusable missing capability is therefore:

> **A semantic gameplay-capability binding fact for an evolved entity, plus a
> rule-composition decision that binds only semantically equivalent entities.**

This is a continuity contract at the existing semantic-delta/GameplayRule
boundary. It is not evidence for a new rule engine, a full rebuild, or a
category-wide RPG rule.

## 12. Exactly one highest-priority Product blocker

**EVOLVED RPG QUEST ENTITIES DO NOT CARRY AN EXPLICIT GAMEPLAY ROLE/CAPABILITY
CONTRACT, SO WORLD EVOLUTION CANNOT SAFELY BIND THE APPROPRIATE EXISTING RPG
RULE.**

User-visible effect: `quest-1` appears and can be targeted, but an ordinary
Player Enter action produces `conditions_failed` rather than a characteristic
RPG consequence. The current data cannot safely answer whether `Quest` should
be treated as `Quest Giver`, `Main Quest`, or another semantic quest role.

This is one blocker. Farm and Survival are passing comparison controls, not
additional blockers.

## 13. Exactly one READY work order

### `WO-S42-001 — Evolved-Entity Gameplay Capability Binding Contract`

Status: **READY — not executed**

Architecture boundary: v1.191 remains unchanged during this discovery.

Mission: close the measured RPG evolved-entity dead end through the existing
semantic-delta, GameplaySpecification, GameplayRule reconciliation, Runtime
event, and trusted action seams. The work must preserve the distinction among
Quest Giver, Main Quest, and a generic Quest, establish enough explicit
semantic capability/role truth to make the binding decision, and compose only
the rule consequence justified by that truth. It must not silently broaden the
current Quest Giver rule to all `quest` entities.

Acceptance boundary for the future authorized execution:

1. `做一个农场游戏` → current two-step baseline → `再加一块麦田` remains a
   same-world, visible, independently identified, harvestable Farm regression.
2. `创建一个 RPG` proves the existing accept/complete baseline, then
   `再加一个任务` keeps the same world and preserves prior
   `questAccepted`/`questCompleted` state.
3. `quest-1` remains independently addressable by normal Enter and receives a
   role-consistent, committed RPG consequence when its semantic intent
   warrants one; a semantically unrelated role must fail honestly rather than
   receive a false Quest Giver consequence.
4. The initial RPG rules are not duplicated, retained state is not reset, and
   no full world rebuild is used.
5. Survival `再加五只怪` retains exact +5, pursuit, contact/combat behavior,
   and canonical visual reuse.
6. The result remains Runtime-authoritative, observable in the existing
   Observatory/Game projections, and generalized to future equivalent
   evolved entities without per-ID rule copies.

The implementation boundary is intentionally expressed as a capability
binding contract, not a preselected class or framework. No product code is
changed by this discovery and this WO is not executed here.

## 14. Why alternatives lost priority

| Candidate | Why it lost |
| --- | --- |
| Relax `Quest Giver` to category `quest` | The existing rule is not ID-bound, but `Quest Giver` is a meaningful semantic distinction. Category broadening could accept Main Quest/objectives incorrectly. |
| Replace archetype matching with the current `role` selector | Current `role` is only a category alias; it cannot distinguish Quest Giver from Main Quest or generic Quest. |
| Append one rule for every new Runtime/entity ID | It duplicates rules, is not generic, and would make future evolution depend on machine IDs. |
| Rebuild the complete RuleSet or add a dynamic registry | Reconciliation already rebuilds affected known rules and preserves binding revisions. No full rebuild or registry is needed to explain this one missing semantic fact. |
| Rename every evolved `Quest` to `Quest Giver` | It fabricates semantics and changes the meaning of `再加一个任务`; a new quest is not proven equivalent to the initial giver. |
| Farm/Survival spatial or control redesign | Both Farm and RPG reach the new target; Farm harvests it, and Survival passes its control. Spatial composition is secondary. |
| Provider/TLS repair | The root Turbo Keychain/TLS issue is a local environment limitation. The production fallback and downstream rules were measurable; it is not the first Product divergence. |
| Inventory/resources/rewards/economy/dialogue/quest framework | None is required to explain or close the first condition-level failure; all are outside the authorized discovery boundary. |

## 15. Explicit state-preservation requirements

Any future execution of `WO-S42-001` must preserve:

- the same `worldId` and active session through World Evolution;
- Farm `wheat-field.harvested=true` and existing
  `harvest-quest.questCompleted=true`;
- RPG `quest-giver.questAccepted=true` and existing
  `main-quest.questCompleted=true`;
- independent Runtime identity and state for `quest-1`;
- the original RPG rule IDs exactly once;
- no full world/Runtime rebuild and no state reset;
- the existing Survival +5 control and canonical visual reuse.

## 16. Explicit non-goals

This Sprint 42 discovery and its single READY WO do not authorize or execute:

- product-code changes during discovery;
- `GameplayRuleRebuilder`;
- `DynamicRuleRegistry`;
- `CapabilityInheritanceSystem`;
- a generic rule ontology;
- `QuestEngine`, `RPGRuntime`, `FarmRuntime`, or a new genre Runtime;
- full RuleSet/world rebuilds;
- per-ID rule duplication;
- category-wide RPG rule broadening without semantic proof;
- inventory, resources, rewards, economy, dialogue, or third-stage quest
  progression;
- a workflow/state-machine framework;
- Sprint 43.

## 17. Discovery verification record

Read-only source-contract tests executed after the audit:

- `@genesis/ai`: **15/15** focused GameplayRule, reconciliation, and
  CreateWorld integration tests passed;
- `@genesis/runtime`: **26/26** focused GameplayRule execution and Player
  interaction tests passed;
- `@genesis/web`: **34/34** focused interaction and World Evolution tests
  passed;
- `git status` was clean before documentation-only changes;
- no product source file was modified;
- no product WO was executed;
- architecture remains v1.191.

The discovery stops here at exactly one READY WO. It does not enter Sprint 43.
