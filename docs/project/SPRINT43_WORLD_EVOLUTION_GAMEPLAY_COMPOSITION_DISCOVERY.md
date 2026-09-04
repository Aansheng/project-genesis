# Sprint 43 — World Evolution Gameplay Composition Expressiveness Discovery

Date: 2026-09-04

Architecture at discovery boundary: **v1.192**

Sprint 42 disposition: **FROZEN — `WO-S42-001` Code Complete = YES;
Product Verified = YES; fresh Gap Analysis PASS**

Git checkpoint: **`e8a4806` — Bind evolved RPG quests to gameplay roles**.
The Human/CTO decision described the WO as uncommitted from the earlier
`8c0b65f` checkpoint, but repository truth had already advanced to `e8a4806`;
the worktree was clean before Sprint 43 Discovery.

Discovery status: **COMPLETE — exactly one Product blocker and exactly one
READY WO generated; documentation/control-plane changes only; no product code
modified; no WO executed; Sprint 44 not entered.** Architecture remains
v1.192.

## Executive finding

Current production World Evolution reaches **Level 2 only by local default
derivation**, not by preserving explicit gameplay-role intent:

1. Level 1 — structural evolution: supported.
2. Level 2 — gameplay role: supported only when Genesis can infer the role
   from `worldType + category + name`.
3. Level 3 — request-authored gameplay-rule evolution: unsupported.

The first production divergence is therefore narrower than a general rule
delta. In a real Studio RPG, `再加一个任务发布者` succeeded as `Add Quest ×1`,
but the new entity was `name=Quest`, `category=quest`, and
`gameplayRole=quest-objective`. The explicit request for the already-known
`quest-acceptor` function was not preserved. The single selected blocker is:

> **WORLD EVOLUTION CANNOT PRESERVE EXPLICIT GAMEPLAY-ROLE INTENT
> INDEPENDENTLY OF ARCHETYPE-DERIVED DEFAULTS.**

Gameplay-condition/action evolution is a real downstream gap, but it loses
priority because explicit bounded role intent diverges first and can be closed
without introducing rule mutation.

## Evidence boundary

The source audit followed the production path:

```text
StudioCommandBar
  → gameStore.send
  → IntentRouter / World Evolution route
  → structured Provider candidate, or deterministic fallback after provider_error
  → parse + semantic target resolution + delta validation
  → immutable Semantic World mutation
  → targeted reconciliation against the existing GameplaySpecification/RuleSet
  → Runtime evolution synchronization
  → existing Runtime systems and GameplayRule executor
  → Renderer / Observatory projection
```

Real Studio was exercised at `http://localhost:5888/`. The run created RPG
worlds `world-1` and `world-3` and Farm `world-2`. Browser warning/error logs
were empty. Focused read-only regressions also passed: AI 25/25 and Web 32/32.

## 1. Current World Evolution semantic-delta schema

`WorldSemanticDelta` contains one or more of these current operations:

| Capability | Current representation | Execution truth |
| --- | --- | --- |
| Entity add | `add-entity { semantic: {name, category, role?}, count }` | Supported; the applier creates `GameWorldEntity {id, name, category}` and drops `semantic.role`. |
| Entity remove | `remove-entity { targetIds }` | Supported for resolved current entities. |
| Entity replace | `replace-entity-semantic { targetIds, from, replacement, preserveIdentity }` | Supported only with identity preservation; authoritative entity remains `{id, name, category}`. |
| Entity properties | Only `movementSpeed` exists as a typed extension point | Explicitly rejected as non-executable in v1 by planner/validator/applier. |
| World properties | `theme` and `timeOfDay` | Supported semantic-session properties. |
| `gameplayRole` | No delta or `GameWorldEntity` field | Not representable as authoritative explicit intent. |
| Gameplay rules | None | Not representable. |
| Rule conditions/actions | None | Not representable. |
| Entity relationships | None | Not representable. |

The current free-form `role?: string` on `EvolutionEntitySemantic` is candidate
metadata. It is neither the bounded `GameplayEntityRole` contract nor retained
by `DefaultSemanticWorldDeltaApplier`.

## 2. Current evolved `gameplayRole` source

The answer is **A: inferred entirely from semantic entity composition**, then
projected during DSL/Runtime composition.

`resolveGameplayEntityRole(worldType, {name, category})` returns:

- RPG `quest` named `Quest Giver` → `quest-acceptor`;
- any other RPG `quest` → `quest-objective`;
- otherwise no gameplay role.

The semantic World Evolution delta does not carry this bounded value. The
semantic applier stores only ID/name/category. `DefaultSemanticGameDslBuilder`
and `createComposedRuntimeEntity` call the resolver later and place the derived
fact on the Runtime semantic component. Provider-authored `role` strings are
not gameplay authority.

## 3. Current World Evolution rule-composition behavior

Evolution does not generate a new GameplaySpecification and does not ask the
CreateWorld gameplay Provider for new rules. It passes the existing
GameplaySpecification, existing bound RuleSet, and semantic mutation into
`DefaultGameplayRuleReconciler`.

The reconciler can preserve, revalidate, rebuild, remove, or newly materialize
**known deterministic baseline rule IDs** when their semantic dependency
fingerprints change. It cannot append a request-authored rule, condition,
action, or relationship. Thus a newly added entity can participate in an
existing category/archetype/gameplay-role rule, but the conversation cannot
change what the rule means.

Current source also corrects a documentation overstatement in ADR-0302: the
RPG completion rule uses `ENTITY_GAMEPLAY_ROLE_EQUALS(quest-objective)`, while
`rpg-interaction` still uses the exact `Quest Giver` archetype. The initial
Quest Giver carries `quest-acceptor`, but that acceptance rule does not yet
consume the role fact.

## 4. CreateWorld versus World Evolution

| Boundary | Gameplay expressiveness |
| --- | --- |
| CreateWorld | Builds a complete GameplaySpecification. Its candidate schema can contain mechanics, interactions, progression, goals, failure conditions, spawn rules, and data-only GameplayRules. Genesis validates rule triggers, conditions, actions, selectors, capabilities, and duplicate IDs before binding the RuleSet. |
| World Evolution | Produces only structural/world-property semantic operations. It retains the original GameplaySpecification and reconciles existing deterministic rule semantics against the changed entity set. |

The measured risk is real: initial generation has a gameplay-rich candidate
contract; conversational evolution currently has a structural candidate
contract plus locally inferred default participation.

## 5. Provider candidate gameplay-semantic expressiveness

The production World Evolution prompt advertises only `add-entity`,
`remove-entity`, `replace-entity-semantic`, and `update-world-property`.
Provider output can syntactically include a free-form semantic `role`, but:

- it is not a `GameplayEntityRole`;
- the target resolver does not use a role-only selector;
- the semantic applier drops it;
- Runtime gameplay role is re-derived locally;
- extra `rules`, `conditions`, `actions`, and relationship fields are ignored
  by the candidate parser.

Therefore the Provider can propose semantic entities and world changes only.
It cannot currently propose an executable gameplay composition through the
World Evolution trust boundary.

## 6. Deterministic fallback expressiveness

The fallback supports bounded structural operations: archetype-native Farm
field and RPG quest additions, Enemy/Merchant additions, two semantic
replacements, Boss removal, and night-time world update. It does not parse or
preserve role modifiers, gameplay conditions, consequences, or relationships.

This produces three truthful outcomes:

- a recognized noun may collapse the request to its default structural add;
- a condition-bearing request may be misclassified by the first recognized
  entity alias;
- an unrecognized semantic modification fails honestly.

## 7. Structural-only results

Accepted v1.192 baselines remain valid:

- RPG `再加一个任务` → same world → `Quest` → locally derived
  `quest-objective` → normal Enter can complete it after retained quest
  acceptance.
- Farm `再加一块麦田` → same world → `Wheat Field` → existing harvest rule is
  reachable.
- Survival `再加五只怪` → same world → exactly five Enemies → existing
  pursuit/contact-damage composition is reachable.

No new rule is authored in any of these cases; existing defaults make the
structural additions gameplay-capable.

## 8. Entity plus explicit gameplay-role results

Real Studio results:

| Command | Observed delta/result | Role truth |
| --- | --- | --- |
| RPG `再加一个任务目标` | `Add Quest ×1`; `quest-1`, `name=Quest`, `category=quest` | `quest-objective` derived locally. The explicit wording is not represented in the delta, although it happens to agree with the default. |
| RPG `再加一个任务发布者` | `Add Quest ×1`; `quest-1`, `name=Quest`, `category=quest` | Incorrectly remains `quest-objective`; requested `quest-acceptor` intent is lost. This is the first production divergence. |
| Farm `再加一块可以收获的麦田` | `Add Wheat Field ×1`; `wheat-field-1`, `category=terrain` | Harvestability is not explicit role data; it comes from existing archetype rule matching. |

## 9. Entity plus condition/consequence and existing-semantic modification

Real Studio results:

- RPG `再加一个任务，接受主线后才能完成` added only another generic Quest:
  `Add Quest ×1`. No condition or rule was added. The new Quest inherits the
  existing objective rule and its pre-existing `questAccepted=true`
  prerequisite; the request did not author that relationship.
- Farm `再加一个收获任务，收获麦田后才能完成` became
  `Add Wheat Field ×1`, because the fallback recognized the field alias. It
  did not add a quest, condition, consequence, or relationship.
- With `quest-2` selected, `把这个任务改成完成后才可触发` failed at structured
  planning; entity count and Runtime world remained unchanged. No gameplay
  semantic mutation was claimed.

## 10. First production divergence

The first divergence occurs at **candidate intent → validated semantic delta**
for a Class B request whose explicit role differs from the archetype default:

```text
再加一个任务发布者
  → fallback recognizes only “add + quest”
  → add-entity { name: Quest, category: quest }
  → semantic applier stores no gameplayRole
  → Runtime derives quest-objective
  → requested quest-acceptor meaning is lost
```

This precedes Runtime gameplay and precedes the larger Class C rule-composition
gap.

## 11. Selected Product blocker

**WORLD EVOLUTION CANNOT PRESERVE EXPLICIT GAMEPLAY-ROLE INTENT INDEPENDENTLY
OF ARCHETYPE-DERIVED DEFAULTS.**

Verified capabilities A/B/C exist: same-world semantic additions, trusted
bounded role derivation, and existing-rule gameplay reachability. Sprint 43
still requires D: one explicit supported role variation must survive natural
language → candidate → validation → semantic delta → Runtime → normal gameplay.
D is the smallest blocker because it fails before request-authored conditions
or actions would be relevant and can reuse the current two-value role contract.

## 12. Exactly one READY work order

### WO-S43-001 — Trusted Explicit Evolved-Entity Gameplay Role Intent

**Status:** READY — not executed

**Priority:** P0 / single Sprint 43 Product blocker

**Architecture before:** v1.192

**Architecture expected after:** v1.193

**Measured bottleneck:** `再加一个任务发布者` creates a generic Quest whose
locally derived role is `quest-objective`; the explicit supported
`quest-acceptor` intent has no authoritative semantic-delta representation.

**Mission:** Preserve one explicit, bounded `GameplayEntityRole` request across
the existing World Evolution trust boundary and make that role mechanically
observable through the existing RPG interaction rule, without adding rule
mutation or a new gameplay authority.

**Dependencies:** Sprint 42 frozen at v1.192; `GameplayEntityRole`,
`ENTITY_GAMEPLAY_ROLE_EQUALS`, semantic delta validation, Runtime semantic
projection, targeted reconciliation, and normal interaction execution already
exist. No additional Human/CTO architecture choice is required for this
bounded slice.

**Allowed scope:**

- a typed optional role fact at the resolved semantic entity/delta and
  authoritative semantic-world boundary;
- Genesis-owned normalization/validation limited to the existing
  `quest-acceptor | quest-objective` vocabulary and compatible RPG quest
  entities;
- bounded Provider-candidate and deterministic-fallback interpretation for
  explicit current-role language;
- default local derivation when no explicit role intent is present;
- use `ENTITY_GAMEPLAY_ROLE_EQUALS(quest-acceptor)` in the existing RPG
  acceptance rule so the explicit role has a normal-player consequence;
- semantic/Runtime projection, targeted reconciliation, Observatory truth,
  focused regression coverage, required gates, documentation, and real Studio
  Product Verification.

**Forbidden scope:** GameplayRule delta, request-authored conditions/actions,
arbitrary capability tags, free-form Provider authority, role ontology or
inheritance framework, per-ID rule copies, full GameplaySpecification/RuleSet
or world rebuild, QuestEngine, RPGRuntime, FarmRuntime, workflow engine,
inventory/resources/rewards/economy/dialogue, a second WO, or Sprint 44.

**Implementation boundaries:** Provider output remains a candidate. Genesis
must reject unsupported roles and incompatible world/category combinations.
An absent explicit role continues through the current deterministic resolver.
Existing entity IDs, Rule IDs, Runtime/session identity, and committed state
must remain stable. The existing objective rule and prerequisite semantics
must not be broadened or rewritten by this slice.

**Acceptance criteria:**

1. Real Studio `创建一个 RPG` → `再加一个任务发布者` keeps the same world and
   creates one visible Runtime quest with authoritative
   `gameplayRole=quest-acceptor`.
2. Normal Player movement + Enter on that new entity executes the existing
   bounded acceptance consequence and commits `questAccepted=true` on that
   entity; repeated Enter is a truthful no-op.
3. `再加一个任务目标` remains `quest-objective`; the current objective path and
   prerequisite behavior do not regress.
4. Provider-authored unknown/free-form roles fail validation or fall back
   truthfully; they never become Runtime authority.
5. Farm field, Survival +5 Enemy, original Quest Giver, and existing evolved
   Quest completion controls remain passing.
6. No world/RuleSet rebuild, per-ID rule, duplicate rule, or state reset occurs.

**Automated tests:** Shared role/delta/applier validation; AI candidate,
fallback, rule-builder, validator, and reconciliation coverage; Runtime
projection/evaluator/evolution preservation; Web real-store front-door tests
for explicit acceptor/objective commands, negative roles, same-world/state
retention, truthful repeat/no-op behavior, and Farm/Survival regressions.
Run affected package suites, TypeScript, ESLint, and direct Web build.

**Product Verification:** Use the real Studio front door and normal controls;
inspect the semantic component and committed Runtime gameplay state; verify
world ID, semantic/runtime revision continuity, unchanged prior state, Rule ID
stability, visible outcome, repeated no-op truth, and empty browser diagnostics.

**Observability:** Record the exact instruction, validated role-bearing delta,
Genesis normalization/validation result, reconciliation facts, Runtime role,
rule condition result, committed mutation, and no-op repetition. Do not report
candidate metadata as authoritative gameplay state.

**Completion report:** architecture before/after; files created/modified;
actual call chain; targeted/full tests; TypeScript; ESLint; build; constraints;
remaining downstream rule-composition gap; manual Product Verification;
Code Complete and Product Verified separately.

**READY self-review:** evidence, Sprint relevance, bounded scope, explicit
non-goals, generic reuse, invariant preservation, Product Verification
feasibility, no speculative infrastructure, satisfied dependencies, and
human-decision status all pass.

## 13. Why alternatives lost

- **General GameplayRuleDelta:** real Class C gap, but wider and downstream of
  the earlier explicit-role loss.
- **Only rename the entity `Quest Giver`:** preserves behavior by conflating
  archetype and gameplay role, reversing Sprint 42's distinction.
- **Only change `rpg-interaction` to the acceptor condition:** consumes the
  existing derived fact but still cannot preserve a conversational role
  variation.
- **Trust Provider `role` strings:** violates the candidate-only authority
  invariant and the bounded Sprint 42 contract.
- **Keep archetype defaults only:** passes objective/harvestable examples by
  coincidence and fails the measured task-publisher variation.
- **Implement entity properties first:** `movementSpeed` is unrelated to the
  measured role divergence and remains non-executable in v1.

## 14. Explicit state-preservation requirements

Any future role or rule evolution must preserve:

- same world/session identity and monotonic semantic/runtime revisions;
- RPG `questAccepted` and `questCompleted` state on all unaffected entities;
- Farm `harvested` and `questCompleted` state;
- Survival Health, XP, Level, active/failed session state, and current entity
  set except for the requested delta;
- existing Runtime component identity/facts for unaffected entities;
- stable Rule IDs and no duplicate rules after repeated natural-language
  mutations.

Current rule identity is only protected inside a built RuleSet by duplicate-ID
rejection and during reconciliation by Rule-ID maps. There is no identity or
idempotency contract for request-authored evolved rules. A later rule-evolution
WO must define that invariant before allowing repeated mutations; this WO does
not solve it.

## 15. Explicit non-goals

- No product implementation during Discovery.
- No GameplayRule/condition/action/relationship mutation.
- No general natural-language or capability ontology.
- No arbitrary Provider authority or executable generated code.
- No full world, GameplaySpecification, or RuleSet rebuild.
- No QuestEngine, ObjectiveManager, DynamicRuleRegistry, FarmRuntime,
  RPGRuntime, inventory, resources, rewards, economy, dialogue, workflow, or
  state-machine framework.
- No repair of the local Provider/TLS environment.
- No execution of `WO-S43-001`, second WO, or Sprint 44 entry.

## Stop boundary

Sprint 42 is frozen. Sprint 43 Discovery is complete at v1.192. Exactly one
READY WO exists: `WO-S43-001`. It is not executed. Stop for Human/CTO review
and do not enter Sprint 44.
