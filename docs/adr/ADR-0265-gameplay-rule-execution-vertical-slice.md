# ADR-0265 — Minimal Gameplay Rule Execution Vertical Slice

- Status: Accepted
- Date: 2026-08-21
- Architecture: v1.150 → v1.151
- Work order: WO-S15-004

## Context

Genesis already emits truthful, bounded `GameplayEvent` facts and stores a
world-bound, Genesis-normalized `GameplayRuleSet`. The missing product seam was
the smallest safe interpretation path from a real contact fact to a Runtime
world mutation. A generic rule engine, score store, damage resolver, goal state,
or provider-executed code would expand the architecture beyond this measured
vertical slice.

## Decision

Add one Runtime-owned, synchronous post-system execution phase:

`GameplayEvent → DefaultGameplayRuleMatcher → DefaultGameplayConditionEvaluator → DefaultGameplayActionExecutor → WorldMutator`

The phase runs only after the Runtime systems finalize the current event batch.
The returned immutable World continues through the existing Renderer and
`RuntimeWorldStore` commit path. WorldStore mutation observation emits the
resulting `ENTITY_REMOVED` fact on the next boundary; rule execution does not
recursively consume its own mutation in the same batch.

The initial executable contract is deliberately narrow:

- Match enabled rules by event type and current world/session/semantic binding,
  with deterministic priority and stable RuleSet ordering.
- Evaluate `ENTITY_CATEGORY_EQUALS`, `ENTITY_ARCHETYPE_EQUALS`,
  `ENTITY_ID_EQUALS`, and whitelisted `COMPONENT_EXISTS` conditions. Contact
  direction and numeric/boolean conditions remain unsupported at execution time.
- Resolve event actor/target, exact entity ID, semantic category, archetype, or
  category-backed role selectors from current semantic/Runtime facts. Entity ID
  prefixes are never treated as semantic truth.
- Execute exactly one supported `REMOVE_ENTITY` action. Missing/stale targets
  fail safely, the Player is protected, and all mutation goes through the
  existing immutable `WorldMutator`.
- Execute only rules whose Genesis-derived `supportStatus` is exactly
  `supported`; partial/deferred/unsupported rules are blocked as whole rules.
- Consume each `eventId + ruleId` at most once within a bounded world/session/
  semantic-revision execution session, resetting at a binding boundary.

`GameplayRuleExecutionResult` is forwarded separately from raw gameplay facts
through Renderer to Observatory. Overview may report the supported slice as
active; deferred/stale rules remain visibly gated. The deterministic collectible
rule is remove-only, while score/numeric reward intent remains deferred.

## Explicit boundary

This ADR does not add score, numeric state, health, damage, enemy AI, goal or
win/lose state, timers, spawn execution, property/velocity actions, contact
direction emission, multi-action transactions, gameplay-rule evolution,
provider calls, scripts, eval, generated code, or a generic `Manager`/workflow
abstraction.

## Consequences

The playable pipeline now has one observable end-to-end gameplay result: a
player contacting a semantic `item` can remove that target and the existing
Renderer naturally stops rendering it. Raw facts remain facts, rule outcomes
remain rule outcomes, and committed Runtime mutations remain the source of
`ENTITY_REMOVED` truth. The executor is intentionally partial; broader action
support must be justified by a measured product scenario and a trusted Runtime
state primitive.

## Verification

- Runtime tests cover contact → match → condition → remove, next-boundary
  removal, deterministic ordering, semantic archetype truth, deferred/stale
  gating, exactly-once execution, and Player protection.
- Runtime, Renderer, Shared, AI, and Web TypeScript checks pass; focused AI/Web
  gameplay-generation regressions pass.
- Local Studio browser verification passed for the Chinese platformer prompt:
  player/coin/goal generation, player → coin contact, remove-only execution,
  next-boundary `ENTITY_REMOVED`, continued player control, and no console
  warning/error logs.
