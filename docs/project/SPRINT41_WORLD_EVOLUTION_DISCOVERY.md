# Sprint 41 World Evolution Gameplay Capability Continuity Discovery

> This document records the discovery-boundary evidence at v1.190. The later
> authorized execution, Product Verification, and fresh post-WO Gap Analysis
> are recorded in [`SPRINT41_WO_S41_001_EXECUTION.md`](SPRINT41_WO_S41_001_EXECUTION.md).

Date: 2026-09-04

Architecture at discovery boundary: **v1.190**

Sprint 40 disposition: **FROZEN — WO-S40-001 Code Complete = YES; Product
Verified = YES; fresh Gap Analysis PASS**

v1.190 Git checkpoint: **04c3090 — Improve Genesis Studio runtime
integration**. The working tree was clean before this discovery. The earlier
statement that the Sprint 40 changes were uncommitted was stale; the
checkpoint already exists and was not amended or replaced.

Discovery status: **DONE at the v1.190 boundary — exactly one Product blocker
and exactly one READY WO generated.** The later execution status is maintained
in the linked execution record; this discovery phase itself modified no
product code, executed no WO, and did not enter Sprint 42.

## Decision boundary

Human/CTO froze Sprint 40 at v1.190 and authorized this discovery only. The
test used the real Genesis Studio front door. The purpose was to determine
whether semantic entities added to an already playable world remain
mechanically reachable through the current gameplay composition.

The known root Turbo Keychain/TLS failure was treated as a local environment
limitation, not as the selected Product blocker. It explains the structured
provider failures observed in this host, but the discovery still audited the
production fallback and the downstream source contracts.

## 1. Farm baseline

Command: 做一个农场游戏

The accepted Sprint 40 real-Studio baseline remains the Farm deterministic
composition with 8 semantic and Runtime entities:

- player, merchant, farmer, barn, wheat-field, corn-field, storage, and
  harvest-quest;
- Runtime is Live, Gameplay is active, XP is 0, and Level is 1;
- the Studio control is Enter — 交互, with Arrow Keys movement.

The v1.190 baseline proof recorded the current two-step loop:

1. Player reached wheat-field at distance 39. The interaction event was
   committed by farm-interaction and set activated=true and harvested=true.
2. After separate traversal, Player reached harvest-quest at distance
   21.9317. The continuation Rule committed questCompleted=true.
3. Repeating the second interaction was a SET_ENTITY_PROPERTY no-op.

Runtime inspection agreed:

- wheat-field gameplay-state: activated=true, harvested=true;
- harvest-quest gameplay-state: questCompleted=true.

This accepted Sprint 40 evidence is the Farm two-step baseline for this
discovery. A fresh Studio run also produced the same 8-entity Farm
composition in world-1, with Runtime Live, Gameplay active, XP 0, and Level
1 before the evolution attempt.

## 2. Exact Farm evolution commands

The exact requested mutation was issued in the same fresh Farm world:

    再加一块麦田

Observed production result:

- route: World Evolution;
- Studio activity: Semantic change failed;
- message: World evolution failed: Structured world evolution planning
  failed;
- Observatory history operation: history-evolution-1;
- operation result: failed: provider_error;
- timeline: REQUEST_RECEIVED success → PROMPT_ASSEMBLY success →
  STRUCTURED_GENERATION failed;
- semantic entity count remained 8;
- Runtime entity count remained 8;
- no semantic delta, Runtime mutation, GameplayRule reconciliation, or
  visual mutation occurred.

The exact Farm field was therefore not created in this environment. The
closest deterministic fallback addition that the current production
vocabulary accepts is:

    增加一个商人

That command was run in a fresh Farm world-2 as a control for the downstream
mutation path. It applied in the same world, changed 8 entities to 9, and
created merchant-1 as a Runtime npc at approximately (460, 400), with
semantic, position, and collision-bounds components. The Studio reported
Runtime synchronized and Visual asset synchronization completed.

This control is not counted as a successful field evolution. Farm's current
interaction categories are terrain and quest, so merchant-1 was visible and
Runtime-present but was not a valid Enter target and could not produce the
Farm harvest consequence.

## 3. Evolved Farm reachability

Answer to the critical question “Can the NEW evolved field be harvested?”:

**Not measurable through the exact production request in this host. No new
field semantic delta was validated, so there was no new field Runtime entity
to harvest.**

The closest successful mutation gives a bounded negative downstream result:
an evolved merchant appears in the same world and is visually synchronized,
but it is not mechanically reachable by the Farm Enter composition because
the current Farm whitelist is terrain and quest. It therefore produces no
ENTITY_INTERACTION_REQUESTED event and no harvested=true consequence.

The result is not “the field is harvestable.” Entity appearance alone is not
accepted as gameplay capability continuity.

## 4. RPG baseline

Command: 创建一个 RPG

The accepted Sprint 40 real-Studio baseline is the 9-entity deterministic RPG
composition:

- player, villager, merchant, quest-giver, enemy, boss, town, forest, and
  main-quest;
- Runtime is Live, Gameplay is active, XP is 0, and Level is 1;
- the Studio control is Enter — 交互, with Arrow Keys movement.

The v1.190 baseline proof recorded the ordered RPG loop:

1. Entering main-quest before the prerequisite produced
   conditions_failed / not-committed.
2. Player reached quest-giver at distance 34. The rpg-interaction Rule
   committed activated=true and questAccepted=true.
3. After separate traversal, Player reached main-quest at distance 21.9317.
   The continuation Rule committed questCompleted=true.
4. Repeating the completion interaction was a truthful no-op.

Runtime inspection agreed:

- quest-giver gameplay-state: activated=true, questAccepted=true;
- main-quest gameplay-state: questCompleted=true.

The fresh Studio session used for this discovery was world-3 and confirmed
the same 9-entity active baseline before evolution.

## 5. Exact RPG evolution commands

The exact requested mutation was issued in world-3:

    再加一个任务

Observed production result:

- route: World Evolution;
- Studio activity: Semantic change failed;
- message: World evolution failed: Structured world evolution planning
  failed;
- operation result: failed: provider_error;
- no semantic delta was applied;
- world-3, the 9 existing Runtime entities, and the current session
  remained intact.

The closest deterministic fallback addition was:

    增加一个商人

It applied in the same world-3 and changed 9 entities to 10 by adding
merchant-1 as an npc. It was visible and Runtime-synchronized, but RPG's
current interaction category is quest. The new merchant was therefore not
Enter-reachable and could not produce the RPG quest-accept consequence.

## 6. Evolved RPG reachability

Answer to the critical question “Does a newly evolved RPG quest/entity become
gameplay-capable?”:

**The exact new quest was not produced, so direct quest reachability could not
be measured. The closest successful evolved entity was merely visible and
Runtime-present; it was not gameplay-reachable through RPG's current quest
target composition.**

This is a measured distinction between semantic/Runtime presence and
gameplay capability. The discovery does not promote the merchant control into
evidence that a newly evolved quest works.

## 7. Survival control result

Commands:

    生成一个幸存者游戏
    再加五只怪

The clean control run used world-5:

- baseline: 6 entities — player, resource, tree, stone, enemy, campfire;
- Runtime was Live, Gameplay active, XP 0, and Level 1;
- after the mutation: same world-5, 11 entities total, exactly +5 Enemy;
- the new semantic and Runtime IDs were enemy-1 through enemy-5.

The control passed the existing behavior:

- each evolved enemy received target-directed movement toward the current
  Runtime player, with targetEntityId=player and speed 1.5;
- the new enemies moved from their safe initial placements toward Player and
  converged on Player's position;
- Observatory recorded contact events after the additions;
- survival-enemy-contact committed DAMAGE_ENTITY against Player, proving
  evolved enemies participate in the current contact/damage gameplay path;
- the visual evolution plan reported no asset generation was required, the
  manifest was rebound, and visual synchronization completed;
- the existing production integration test independently asserts that added
  Survival Enemy entries reuse the first Enemy artwork and issue no image
  request.

Direct Space attack input was not used as the deciding evidence in this run:
the browser input observation did not produce a reliable health change. The
contact-driven damage events are sufficient for the requested control because
they are committed Runtime combat consequences from the evolved enemies.

Survival is therefore the successful comparison: its generic Runtime
composition supplies a capability-relevant component to each added Enemy,
and its category-based rules reach the evolved group.

## 8. CreateWorld versus World Evolution

| Stage | CreateWorld | World Evolution |
| --- | --- | --- |
| Front door | Studio command is executed as a new-world command | Studio command is routed to the active-world evolution path |
| World identity | A new world ID is allocated and the current world is replaced | The request carries the current world ID; successful mutation keeps it |
| Semantic operation | Full semantic world is generated and projected | A validated semantic delta is applied to the current semantic world |
| Runtime operation | Runtime projection creates the new world | Runtime synchronizer adds/removes/replaces only affected entities |
| Gameplay composition | Returned GameplayRuleSet is bound to the new world | Current rules are reconciled against the semantic delta |
| Visual operation | New design/asset state is initialized | Visual delta is planned/executed against the current manifest |
| Session/state | New-world path starts a fresh active session | Successful evolution does not reset retained Runtime entities or their components |

The actual application path is:

    CreateWorld:
    Studio → gameStore.send → command executor → semantic world →
    Game DSL/Runtime projection → returned GameplayRuleSet → new session

    World Evolution:
    Studio → gameStore.send → planEvolution → structured/fallback planner →
    semantic delta applier → GameplayRule reconciler → Runtime synchronizer →
    visual evolution → Observatory

The current source passes world ID and semantic/runtime/visual revisions into
the evolution request. After a validated mutation, gameStore keeps the
current world ID, updates the semantic revision, reconciles rules, updates
the existing Runtime world, and loads the synchronized world into
Observatory. It does not execute the CreateWorld replacement/reset branch.

The first divergence in the Farm and RPG traces occurs before the semantic
delta applier. The exact request never reaches Runtime mutation or Gameplay
Rule reconciliation.

Source anchors used for this comparison are:

- apps/web/src/stores/gameStore.ts:903-1112 — routing, current-world
  evolution context, reconciliation, Runtime synchronization, and visual
  evolution;
- packages/shared/src/world-evolution/SemanticWorldDeltaApplier.ts:154-301 —
  atomic current-world semantic delta application and stable added IDs;
- packages/runtime/src/evolution/RuntimeWorldEvolutionSynchronizer.ts:170-301
  — same-world revision guards, retained entities, and affected-entity
  synchronization;
- packages/runtime/src/composition/RuntimeEntityComposition.ts:233-267 —
  composed Runtime components, including Survival target-directed movement;
- packages/runtime/src/systems/DefaultPlayerInteractionRequestSystem.ts:60-136
  — Enter edge, category whitelist, range, nearest target, and event emission;
- apps/web/src/components/studio/runtimeMotionProfile.ts:29-99 — Farm/RPG
  interaction target categories and Survival system registration;
- packages/ai/src/gameplay/GameplayRuleBuilder.ts:188-383 and
  packages/ai/src/gameplay/GameplayRuleReconciler.ts:61-289 — current
  archetype binding, state conditions, dependency fingerprints, and
  deterministic reconciliation;
- packages/ai/src/world-evolution/DefaultWorldEvolutionPlanner.ts:218-239
  and 411-491 — deterministic fallback vocabulary and provider-error stage.

## 9. Current GameplayRule binding semantics

The audit found existing generic primitives sufficient for the Survival
control and for the original Farm/RPG two-step baselines:

| Primitive | Current production behavior |
| --- | --- |
| GameplayRule conditions | Category, archetype, ID, component, contact, NUMBER_COMPARE, and BOOLEAN_EQUALS conditions exist and are validated |
| Entity properties | Typed gameplay-state properties are committed through Runtime actions and read by later conditions |
| Numeric game state | XP/Level and CHANGE_NUMERIC_STATE exist; NUMBER_COMPARE is used by the Survival progression slice |
| Gameplay events | ENTITY_INTERACTION_REQUESTED, ENTITY_ATTACK_REQUESTED, contact, damage, removal, and related events are available |
| SET_ENTITY_PROPERTY | Trusted Runtime action; repeated writes are truthful no-ops |
| REMOVE_ENTITY / SPAWN_ENTITY | Existing validated generic actions; used by existing Survival slices, not required by this discovery |
| XP / Level | Current-session Runtime progression state; Farm/RPG fresh evolution runs remained XP 0 / Level 1 |
| Goal/completion semantics | Existing bounded goal/session completion and entity questCompleted properties exist; there is no open-ended objective/workflow manager |

The current interaction binding is:

1. DefaultPlayerInteractionRequestSystem listens for an Enter edge.
2. It filters by an explicit category whitelist and finite range 48, selects
   the nearest target, breaks ties by stable Runtime ID, and emits
   ENTITY_INTERACTION_REQUESTED. No target means no event and no mutation.
3. Studio configures Farm with terrain and quest targets, and RPG with quest
   targets.
4. Farm's deterministic rule builder selects the first field-like terrain
   using field/crop/farmland/wheat/corn identity matching, then binds the
   interaction target by category plus exact archetype name. Its continuation
   reads harvested=true from that selected archetype and targets the selected
   completion quest.
5. RPG's deterministic rule builder selects the first quest-giver-like quest,
   binds the interaction target by category plus exact archetype name, reads
   questAccepted=true from that selected archetype, and targets the selected
   main/final quest.
6. GameplayRule reconciliation fingerprints category, role, archetype, ID,
   property, trigger, and action dependencies. It preserves, revalidates,
   rebuilds, or removes existing deterministic rules, and adds only rules
   present in the deterministic after-baseline. It does not infer a new
   gameplay Rule for every arbitrary semantic entity.

This explains the comparison. Survival's evolved Enemy uses the generic
category/component composition that its existing rules consume. Farm/RPG
archetype rules currently depend on the selected initial semantic archetype
and do not expose a general “new field/new quest inherits the characteristic
Rule” contract.

That rule-binding limitation is a downstream acceptance concern, not the
selected FIRST divergence: the exact Farm/RPG requests failed before a
semantic delta existed.

## 10. Authoritative state preservation

Result: **No state loss was observed; direct combined Farm/RPG
characteristic-state preservation was not measurable because the exact field
and quest deltas did not apply.**

The source-backed preservation contract is clear:

- evolution requests carry the current world ID and revisions;
- semantic delta application appends new semantic entities to the current
  world and increments the semantic revision; it does not rebuild or reset
  the world;
- Runtime synchronization starts from the current Runtime entity list;
  retained IDs and their existing component objects remain in the working
  world, while only added/removed/replaced entities are touched;
- gameStore keeps the current world ID and does not call the new-world session
  reset path during successful evolution.

Therefore existing Farm harvested / questCompleted and RPG questAccepted /
questCompleted properties are architecturally preserved on retained Runtime
entities during an add-only evolution. The exact failed requests left all
authoritative state unchanged. A later execution must add direct real-Studio
proof that commits the v1.190 state first, evolves the world second, and
re-reads those four state facts.

## 11. FIRST production divergence

The first divergence is:

**World Evolution reaches the correct route and receives the current-world
context, but structured generation fails with provider_error at
STRUCTURED_GENERATION before candidate parsing, semantic-delta validation,
Runtime mutation, or GameplayRule reconciliation.**

This was measured in both exact requests:

- Farm: 再加一块麦田;
- RPG: 再加一个任务.

The deterministic fallback is not a complete control for these requests. Its
current addition vocabulary covers Enemy and Merchant, but not a validated
Farm field/wheat/crop addition or RPG quest/task addition. That leaves no
production semantic delta with which to test new-entity gameplay continuity.

The local provider/TLS failure itself is not selected as a Product blocker.
The actionable product gap is the absence of a validated archetype-native
fallback/semantic-delta path when the structured provider is unavailable.

## 12. Exactly one highest-priority Product blocker

**BLOCKER — The production World Evolution path cannot currently produce a
validated Farm-field or RPG-quest semantic entity delta through the real
front door under provider-unavailable conditions, so evolved-entity gameplay
capability continuity cannot begin.**

This is one shared blocker at the first semantic-generation boundary. It
precedes Runtime composition and GameplayRule reachability and is therefore
the only blocker selected from this discovery.

## 13. Exactly one READY WO

### WO-S41-001 — Generic Archetype-Native World Evolution Entity Reachability

status: **READY — not executed**

architecture_before: **v1.190**

architecture_after: **v1.191 only if separately authorized, implemented, and
verified**

priority: **P0 — the single Sprint 41 Product blocker**

mission:

Enable one shared production World Evolution semantic-delta path that accepts
the Farm field and RPG quest mutations through the existing front door, then
proves that the evolved entities remain gameplay-capable in the same world.
Use the existing planner/fallback, semantic delta, Runtime synchronization,
GameplayRule, input, and visual seams. The work must be the smallest
evidence-backed continuity slice; it must not rebuild the world or create a
new gameplay framework.

required acceptance:

1. Farm: after 做一个农场游戏 and the existing v1.190 two-step baseline,
   issue 再加一块麦田 or the exact production-supported equivalent; route is
   World Evolution, the world ID is unchanged, and prior
   harvested/questCompleted state remains authoritative.
2. The new Farm field exists in semantic and Runtime state, is visibly
   present, is an eligible Enter target, and commits the existing Farm
   characteristic consequence harvested=true when normally harvested.
3. RPG: after 创建一个 RPG and the existing v1.190 two-step baseline, issue
   再加一个任务 or the exact production-supported equivalent; route is World
   Evolution, the world ID is unchanged, and prior
   questAccepted/questCompleted state remains authoritative.
4. The new RPG quest/entity exists in semantic and Runtime state, is visibly
   present, is an eligible Enter target, and reaches an appropriate existing
   RPG GameplayRule consequence. It must not be merely visible.
5. Farm and RPG use one shared generic continuity seam. No genre-specific
   Runtime is added. The resulting GameplayRule binding must be explicit and
   observable for the evolved target; no arbitrary UI-only inference counts.
6. The existing Survival control remains same-world, exactly +5 Enemy,
   pursuit-capable, contact/damage-capable, and canonical-visual reuse
   correct.
7. Observatory records route, same-world identity, semantic delta, Runtime
   synchronization, GameplayRule reconciliation, visual synchronization,
   committed state, and truthful no-target/repeat behavior.
8. Runtime remains the only gameplay authority and no Provider call occurs
   during gameplay execution.

allowed boundary:

- Reuse and minimally extend the existing World Evolution planner/fallback
  vocabulary and semantic add-entity contract.
- Reuse the current Runtime composed-entity path and existing interaction
  event/property/rule seams.
- Add focused tests for same-world state preservation, evolved-target
  reachability, rule binding, observability, and Survival regression.
- Update ADR/project/control-plane documentation only as required by the
  authorized implementation.

forbidden boundary:

- No CapabilityInheritanceSystem, GameplayRuleRebuilder,
  DynamicRuleRegistry, FarmRuntime, RPGRuntime, or new gameplay framework.
- No world rebuild to obtain continuity.
- No InventorySystem, ResourceSystem, rewards, economy, DialogueEngine,
  QuestEngine, ObjectiveManager, workflow/state-machine framework, or
  multi-stage progression framework.
- No third-stage gameplay expansion.
- No root Keychain/TLS environment repair as a substitute for Product work.
- No second Sprint 41 WO and no Sprint 42 entry.

verification gate:

The WO is not complete until targeted tests, affected package gates,
TypeScript, ESLint, relevant regression suites, direct Web build, and real
Studio Product Verification all pass. Product Verification must include the
post-baseline evolution sequence for both Farm and RPG, not merely entity
appearance.

## 14. Why alternatives lost priority

| Candidate | Why it lost |
| --- | --- |
| Root Turbo Keychain/TLS repair | It is a local environment limitation explicitly excluded from the Sprint 40 freeze decision and does not constitute the first Product capability gap |
| GameplayRule rebinding/inheritance as a standalone item | It is downstream of the first divergence; the exact Farm/RPG semantic delta never reached reconciliation |
| Farm/RPG spatial or keyboard-control redesign | The accepted v1.190 baselines reached both interactions; the fresh browser input issue was an observation limitation, not a measured product break |
| State/session rebuild or reset repair | Add-only evolution preserves retained Runtime entities/components in source; no state loss was observed |
| Inventory, resources, rewards, economy, dialogue, or quest architecture | They are later domain expansions and are outside the first shared measured capability |
| Survival pursuit/combat/visual work | The control passed with same world, +5 enemies, pursuit, contact damage, and visual reuse |

The downstream GameplayRule binding requirement remains inside the single
READY WO's acceptance criteria, but it is not promoted to a second blocker or
a second work order.

## 15. Explicit non-goals and stop condition

This discovery does not:

- modify product code;
- execute WO-S41-001;
- enter Sprint 42;
- extend Sprint 40;
- introduce third-stage gameplay;
- introduce inventory, resources, rewards, economy, dialogue, QuestEngine,
  ObjectiveManager, FarmRuntime, RPGRuntime, or workflow/state-machine
  frameworks;
- rebuild a world to obtain capability continuity;
- count semantic/Runtime/visual presence as gameplay success;
- invent a blocker when the evidence is only a provider/environment failure;
- generate a second READY WO.

Final discovery disposition:

- Sprint 40 is **FROZEN at v1.190**.
- WO-S40-001 is **DONE; Code Complete = YES; Product Verified = YES**.
- Fresh Sprint 40 Gap Analysis is **PASS**.
- Sprint 41 Discovery is **DONE**.
- Exactly one blocker and exactly one READY WO exist: WO-S41-001.
- Product code remains unchanged during this Sprint 41 discovery.
- Stop here for Human/CTO review and separate authorization.
