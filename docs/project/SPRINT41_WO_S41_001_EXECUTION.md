# Sprint 41 — WO-S41-001 Execution Record

Date: 2026-09-04
Architecture: **v1.190 → v1.191**
Work order: **WO-S41-001 — Generic Archetype-Native World Evolution Entity Reachability**
Status: **DONE — Code Complete = YES; Product Verified = YES**
Fresh Sprint 41 Gap Analysis: **PASS for the authorized first divergence**
Current gate: **SPRINT41_FREEZE_REVIEW**
Sprint 42: **not entered**

## Scope and decision boundary

Human/CTO authorized this single WO after Sprint 41 discovery identified the
first production break:

```text
natural-language World Evolution
  → correct World Evolution route
  → STRUCTURED_GENERATION
  → provider_error
  → no semantic delta
  → no Runtime entity mutation
```

The authorized fix was only a bounded deterministic path for clear additions
of roles already supported by the current archetype. It was not an invitation
to repair downstream GameplayRule inheritance or to create a deterministic
natural-language editor.

## 1. First divergence and implementation

The existing deterministic candidate provider already handled Enemy and
Merchant additions. Farm-field and RPG-quest additions failed only because
their archetype-native roles were absent from that bounded vocabulary. The
active semantic world's `worldType` was already present in the World Evolution
request, so it was sufficient context to resolve an unambiguous role without
requiring the user to repeat the genre.

The implementation extends the existing
`DeterministicWorldEvolutionCandidateProvider`:

- `farm` + a clear field alias produces the normal `add-entity` candidate
  `{ category: 'terrain', name: 'Wheat Field' }`.
- `rpg` + a clear quest alias produces the normal `add-entity` candidate
  `{ category: 'quest', name: 'Quest' }`.
- Counts use the existing bounded count parser, including reasonable `再来`
  phrasing; the implementation does not compare exact sentences.
- Unknown, ambiguous, cross-genre, and non-addition requests remain closed;
  no arbitrary noun is mapped to a category.

The candidate remains untrusted. It goes through the unchanged path:

```text
StudioCommandBar
  → gameStore.send
  → World Evolution route
  → structured candidate, or provider-error deterministic candidate
  → parse / target resolver / semantic-delta validator
  → SemanticWorldDeltaApplier
  → GameplayRule reconciliation
  → RuntimeWorldEvolutionSynchronizer
  → visual evolution / Observatory
```

No direct Runtime insertion, CreateWorld replacement, second router, Provider
call during gameplay, or new framework was added.

## 2. Farm baseline and exact evolution

Baseline command:

```text
做一个农场游戏
```

The deterministic Farm baseline is 8 semantic and Runtime entities:
`player`, `merchant`, `farmer`, `barn`, `wheat-field`, `corn-field`,
`storage`, and `harvest-quest`. Runtime is Live, Gameplay is active, and
Studio exposes `Enter — 交互`.

Exact evolution command under the normal local provider-unavailable
condition:

```text
再加一块麦田
```

Real Studio result in **world-5**:

- route remained World Evolution; the command did not terminate at
  `provider_error`;
- the semantic revision advanced by one and the world ID stayed `world-5`;
- exactly one semantic and Runtime entity, `wheat-field-1`, was added;
- Runtime inspection showed `type: terrain`, semantic `name: Wheat Field`,
  position `(376, 400)`, and independent Runtime identity;
- the new field rendered on the Studio canvas with the existing visual path;
- repeated Enter input while Player was within range committed
  `activated=true` and `harvested=true` on `wheat-field-1`.

A separate same-session Farm run in **world-2** established the existing
`wheat-field` as harvested before the add-only evolution. After the mutation,
Runtime inspection still showed `activated=true, harvested=true` on that
retained entity. Thus the new semantic delta did not reset prior Farm state.

## 3. RPG baseline and exact evolution

Baseline command:

```text
创建一个 RPG
```

The deterministic RPG baseline is 9 semantic and Runtime entities:
`player`, `villager`, `merchant`, `quest-giver`, `enemy`, `boss`, `town`,
`forest`, and `main-quest`. Runtime is Live, Gameplay is active, and Studio
exposes `Enter — 交互`.

The exact mutation was issued in the same active world:

```text
再加一个任务
```

Real Studio result in **world-6**:

- route remained World Evolution and the world ID stayed `world-6`;
- the pre-existing `quest-giver` retained
  `activated=true, questAccepted=true` from the baseline interaction;
- exactly one semantic and Runtime entity, `quest-1`, was added;
- Runtime inspection showed `type: quest`, semantic `name: Quest`, position
  `(872, 384)`, and an independent Runtime identity;
- the new quest was visible through the normal visual/static fallback path.

The required post-creation interaction measurement was also completed. With
Player at the new quest, Observatory recorded:

```text
ENTITY_INTERACTION_REQUESTED · player → quest-1 · distance=16
rpg-interaction · conditions_failed · not-committed
rpg-complete-main-quest · conditions_failed · not-committed
```

The new `Quest` therefore is Enter-reachable as a target, but it does not yet
receive the RPG characteristic consequence. The current deterministic RPG
rule is bound to the exact initial `Quest Giver` archetype. This is the newly
measurable downstream gap and was intentionally not repaired inside this WO.

## 4. Survival control

Commands:

```text
生成一个幸存者游戏
再加五只怪
```

Real Studio control result in **world-4**:

- same world ID;
- baseline 6 entities became 11;
- exactly `enemy-1` through `enemy-5` were added;
- the evolved enemies retained target-directed movement toward Player;
- Observatory recorded contact events after convergence;
- `survival-enemy-contact` committed `DAMAGE_ENTITY` against Player;
- the visual plan reused the canonical Enemy artwork and did not require a
  new asset for each added entity.

This successful comparison remains category/component-driven and is not
regressed by the Farm/RPG fallback.

## 5. Merchant and unknown-request regressions

In the active Survival world, the existing supported command:

```text
增加一个商人
```

still produced `merchant-1` as a Runtime `npc`, increasing the world from 11
to 12 entities and reporting semantic/runtime/visual synchronization.

The unsupported request:

```text
再加一只独角兽
```

left the same world at 12 entities and returned the existing honest failure.
No Unicorn semantic or Runtime entity was fabricated.

## 6. CreateWorld versus World Evolution

The implementation preserves the existing distinction:

| Concern | CreateWorld | World Evolution in this WO |
| --- | --- | --- |
| World identity | allocates/replaces a world | retains the active world ID |
| Semantic operation | full world projection | one validated add-entity delta |
| Runtime | projects a new world | synchronizes only the affected addition |
| Gameplay | builds the initial RuleSet | reconciles the current RuleSet |
| Session state | starts a new session | retains existing Runtime entities/components |
| Provider | candidate at generation time | candidate at generation time; never gameplay authority |

The first divergence is now closed: both exact Farm/RPG commands reach the
semantic delta and Runtime stages under Provider-unavailable conditions.

## 7. Generic primitive and binding audit

The audit found no need for a new primitive:

| Primitive | Current production role |
| --- | --- |
| GameplayRule conditions | category, archetype, ID, component, contact, `NUMBER_COMPARE`, and `BOOLEAN_EQUALS` validation/evaluation |
| Entity properties | typed `gameplay-state` facts committed by Runtime actions and read by later conditions |
| Numeric game state | Runtime-owned XP/Level with `CHANGE_NUMERIC_STATE`; `NUMBER_COMPARE` is already used by Survival progression |
| Gameplay events | interaction, attack, contact, damage, removal, and related Runtime observations |
| `SET_ENTITY_PROPERTY` | trusted property mutation; repeat writes are truthful no-ops |
| `REMOVE_ENTITY` / `SPAWN_ENTITY` | existing validated generic actions, not expanded here |
| XP / Level | existing current-session progression; Farm/RPG evolution remained Level 1 in these runs |
| Goal/completion semantics | existing bounded goal/session completion and entity completion properties; no workflow manager |

Current interaction binding is explicit:

- the Runtime interaction system filters Farm `terrain`/`quest` and RPG
  `quest` categories, then emits `ENTITY_INTERACTION_REQUESTED` for the
  nearest in-range target;
- Farm's characteristic rule matches field-like terrain by category plus exact
  archetype name. The evolved `Wheat Field` matches it and harvested state was
  committed;
- RPG's characteristic rule matches the selected initial `Quest Giver` by
  category plus exact archetype name. The evolved `Quest` emits an interaction
  event but does not match that rule;
- Survival's evolved Enemy receives the generic enemy health and
  target-directed-movement composition consumed by its existing rules.

No rule inheritance/rebuilder/registry was added. The first divergence fixed
by this WO is provider-error semantic-delta reachability; the RPG exact-
archetype rule gap is downstream.

## 8. State, identity, space, and readability

- Same-world identity was verified for Farm, RPG, and Survival.
- Existing Farm harvested state and RPG `questAccepted` state survived their
  add-only mutations.
- New entities received independent Runtime IDs (`wheat-field-1`, `quest-1`,
  `enemy-1..enemy-5`); visual asset reuse did not share Runtime state.
- Farm/RPG spatial/control composition was not expanded. Farm's new field was
  normally interacted with; RPG's new quest was reached at distance 16.
- The RPG next state is Player-readable through the existing Observatory event
  stream (`conditions_failed` / `not-committed`), but no characteristic
  consequence is shown because the current Rule does not bind the evolved
  archetype. This is recorded as a product gap rather than hidden by UI.

## 9. Fresh Sprint 41 Gap Analysis

**PASS for WO-S41-001.** The authorized first divergence is closed:

```text
Provider unavailable
  → clear supported Farm/RPG addition
  → validated semantic delta
  → same-world semantic/runtime mutation
```

The post-fix downstream result is now measurable:

- Farm evolved field: **gameplay-capable**; Enter commits `harvested=true`.
- RPG evolved quest: **semantic/Runtime-present and Enter-reachable, but not
  consequence-capable**; the exact `Quest Giver` rule remains the first
  downstream divergence.

This downstream RPG gap is recorded for Human/CTO review. It is not repaired
inside `WO-S41-001`, no second WO is generated automatically, and Sprint 42 is
not entered.

## 10. Exactly one work-order disposition

The only authorized work order was:

```text
WO-S41-001 — Generic Archetype-Native World Evolution Entity Reachability
```

Disposition:

- Code Complete = **YES**
- Product Verified = **YES**
- DONE
- Architecture: **v1.191**
- Current gate: **SPRINT41_FREEZE_REVIEW**
- Next ready WO: **NONE**

No additional READY item was generated after the new RPG downstream gap was
measured.

## 11. Why alternatives lost priority

- Root Turbo Keychain/TLS repair is a local environment limitation and is not
  the Product first divergence.
- GameplayRule inheritance/reconciliation is downstream of the missing
  semantic delta; Farm already proved the current rule can reach the evolved
  field, while RPG needs a separate measured decision.
- Spatial/control redesign was not the first break; the real Studio reached
  the Farm field and RPG quest coordinates, and the input observation was
  sufficient to measure both outcomes.
- World rebuild/reset would violate same-world and state-preservation
  requirements; add-only synchronization retained state.
- Inventory, resources, rewards, economy, dialogue, QuestEngine,
  ObjectiveManager, FarmRuntime, RPGRuntime, and workflow/state-machine
  frameworks are outside the first bounded capability.
- Survival pursuit/contact damage/visual behavior already passed and had no
  priority over the provider-error semantic boundary.

## 12. Explicit non-goals

This WO does not introduce:

- a second IntentRouter or a general deterministic NLP parser;
- `CapabilityInheritanceSystem`, `GameplayRuleRebuilder`,
  `DynamicRuleRegistry`, or any new gameplay framework;
- FarmRuntime, RPGRuntime, InventorySystem, ResourceSystem, rewards, economy,
  DialogueEngine, QuestEngine, ObjectiveManager, or a progression/workflow
  framework;
- third-stage gameplay, world rebuild, direct Runtime injection, Provider
  runtime calls, or a second Sprint 41 WO;
- Sprint 42 entry.

## 13. Quality gates and Product Verification

Passed:

- AI focused World Evolution tests: **16 passed**.
- Full AI suite: **156 files / 9,444 tests passed**.
- Web focused World Evolution integration: **30 passed**.
- Full Web suite: **52 files / 3,590 tests passed**.
- Shared: **211 tests passed**; Runtime: **716**; Renderer: **517**.
- AI, Shared, Runtime, Renderer, and Web TypeScript checks: **passed**.
- Package ESLint: **0 errors**; existing repository warnings remain.
- Direct Web production build: **passed** (1,020 modules transformed).
- `git diff --check`: **passed**.

Real Studio Product Verification used the natural-language front door for the
Farm, RPG, and Survival sequences above. Full Observatory agreed with the
Runtime inspector for world identity, semantic delta, Runtime synchronization,
Rule decisions, state preservation, and visual execution. Browser diagnostics
contained no feature-attributable warnings or errors (`[]`). After metadata
update, Observatory displayed **v1.191 / Sprint 41**.

Root Turbo orchestration remains subject to the authorized local Keychain/TLS
limitation. Direct package gates and the affected Web production build passed;
no environment repair was attempted.
