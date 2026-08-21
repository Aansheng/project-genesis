# ADR-0264 — Trigger / Condition / Action Gameplay Rule Foundation

- Status: Accepted
- Date: 2026-08-21
- Architecture: v1.149 → v1.150
- Work order: WO-S15-003

## Context

Project Genesis now has two truthful gameplay authorities:

- `GameplaySpecification` describes how a world is intended to play.
- `GameplayEvent` reports what the Runtime actually observed.

The missing boundary is a provider-neutral description of what an observed fact
means. A rule such as contact with a collectible → remove the target and change
score must be representable without turning the Runtime into a collection of
genre-specific systems. Runtime does not yet have a rule matcher, condition
evaluator, generic gameplay state, health resolver, or goal executor.

## Decision

Add an immutable shared rule domain:

- `GameplayRuleSpecification` contains a stable Genesis-normalized `ruleId`,
  label, enabled state, source mechanic, trigger, conditions, actions, priority,
  and Genesis-derived support status.
- `GameplayTrigger` accepts only the five observed v1 event types:
  `ENTITY_CONTACT_STARTED`, `ENTITY_JUMPED`, `ENTITY_LANDED`, `ENTITY_ADDED`,
  and `ENTITY_REMOVED`.
- `GameplayEntitySelector` uses event actor/target, exact current entity ID,
  current semantic category, current semantic name/archetype, or a
  category-backed role. It never derives semantic truth from an ID prefix.
- `GameplayCondition` is a small discriminated union for category, archetype,
  ID, contact direction, numeric/boolean comparison, and known component
  existence. Contact direction is representable but deferred because the
  current contact fact has no direction.
- `GameplayAction` is a typed data union for remove, spawn, numeric state change,
  entity property update, velocity application, goal completion, and damage.
  There are no functions, scripts, eval paths, expression strings, or provider
  payloads.
- `GameplayRuleSet` is the immutable, session-scoped derived intent root. It
  records source Gameplay revision, semantic revision binding, world/session
  identity, capability catalog version, rules, and an explicit
  `execution.status = not-active` marker.

Genesis owns validation and support truth. Provider candidates are normalized,
current entity references are checked, actions are whitelisted, duplicate rule
IDs are rejected, and provider support claims are ignored. Rule status is
derived from the capability catalog: all supported primitives are supported;
mixed supported/deferred primitives are partially supported; rules whose
required effects are deferred remain deferred; unsupported primitives are
unsupported.

The deterministic builder maps the existing `GameplaySpecification` to a small
generic baseline. It can represent collectible contact, enemy stomp, side
damage, goal contact, farm interaction, survival contact, and question-block
reward shapes without introducing Mario/Farm/Survivor Runtime classes.

The production flow is:

`GameplaySpecification → GameplayRuleBuilder → GameplayRuleValidator → GameplayRuleSet`

The provider-facing flow is:

`GameplayRuleCandidate → Genesis validator → immutable GameplayRuleSet`

The current web session stores a world-bound RuleSet beside the semantic world,
Runtime world, and GameplaySpecification. World replacement replaces the RuleSet.
Semantic world evolution marks the existing RuleSet stale instead of silently
claiming mechanic synchronization; rule evolution is a future boundary.

## Explicit boundary

S15-003 stops at rule description and capability truth. It does not add:

- Runtime trigger matching;
- condition evaluation;
- action execution or a rule engine;
- score, health, XP, goal, timer, spawn, or win/lose state;
- contact direction emission;
- generated code, eval, scripting, or a generic workflow engine;
- genre-specific Runtime systems or a Gameplay Manager.

The future execution chain is:

`GameplayEvent → TriggerMatcher → ConditionEvaluator → GameplayActionExecutor → trusted Runtime mutation`

## Consequences

AI/game design can express generic gameplay relationships while Runtime remains
small and truthful. Observatory can show desired mechanics, structured rule
plans, and actual Runtime facts as separate surfaces. A rule may be fully
supported at the primitive-description level while execution is visibly
inactive; no rule creation can mutate Runtime state or Event Stream facts.

The rule schema intentionally has a small ceiling. Directional contact needs a
future Runtime fact, and state/damage/goal actions need trusted Runtime stores
and executors. Those gaps are explicit inputs to S15-004 rather than hidden
fallback behavior.

## Verification

- Shared and AI contracts are immutable and serializable.
- Focused AI tests cover five rule examples, selector/reference validation,
  unique IDs, deterministic mapping, support derivation, code/script rejection,
  and bounded generation context.
- Existing AI/Web gameplay generation and Runtime Event Stream regressions stay
  green; the Runtime package is not modified by this work order.
- Browser verification confirmed Platformer/Farm/Survivor RuleSet isolation,
  real contact facts, unchanged Runtime behavior, an explicit `Planning only`
  Observatory label, no `TIMER_ELAPSED`, and empty error/warning logs.
