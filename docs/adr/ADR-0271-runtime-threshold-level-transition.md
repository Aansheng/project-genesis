# ADR-0271 — Runtime-Authoritative XP Threshold Level Transition

- Status: Accepted
- Date: 2026-08-24
- Architecture: v1.156 → v1.157
- Work order: WO-S16-003

## Context

WO-S16-002 established a Runtime-owned finite numeric progression map and a
trusted `CHANGE_NUMERIC_STATE` action. Sprint 16 still lacked the smallest
observable progression transition: gaining enough experience had no executable
threshold or level state. The existing Shared schema already contains typed
`NUMBER_COMPARE` conditions and `gameState` references, so the measured gap is
Runtime evaluation plus one deterministic rule—not a progression framework.

## Decision

Keep the existing authority and execution path:

`GameplayEvent → ordered GameplayRule → CHANGE_NUMERIC_STATE experience +1 →
NUMBER_COMPARE(gameState) → CHANGE_NUMERIC_STATE level +1 → Runtime/Web/
Renderer/Observatory projection`

The Runtime progression binding starts with the finite baseline
`experience=0, level=1`. `DefaultGameplayConditionEvaluator` executes finite
typed numeric comparisons for event payload, entity property, and Runtime
`gameState` references with the six whitelisted operators. Missing/non-finite
values fail safely; no expression language or arbitrary evaluation is added.

The deterministic platformer baseline adds one `level-up` rule after the
collect-reward rule. It requires `experience >= 1` and `level < 2`, then uses
the existing `CHANGE_NUMERIC_STATE level +1` action. The second condition is
the exactly-once guard: repeated evaluation after Level 2 fails without a
manager, hidden flag, or new action type. The rule is matched from the event
boundary before item removal, while its numeric conditions read the staged
Runtime progression state after XP gain.

## Explicit boundary

This ADR does not add `ProgressionManager`, `XPManager`, `SurvivorRuntime`,
skill selection, upgrade catalogs, modifiers, waves, spawning, scaling,
death/respawn, offline World Evolution fallback, generated code, eval, or a
generic progression framework. Web, Pinia, Renderer, and Observatory remain
projections; Runtime remains the sole committed progression authority.

## Consequences

The first generic progression transition is executable and measurable without
coupling Runtime to a genre. Same-session semantic World Evolution retains the
committed values because the binding remains stable; a new world/session binds
the baseline; stale World A events/rules fail before they can mutate World B.
The numeric state remains a small keyed primitive, not a promise of future
level curves or upgrade behavior.

## Verification

- Runtime tests cover finite numeric comparison, XP ordering, Level 1 → Level 2,
  exactly-once blocking, revision retention, reset, and stale isolation.
- Shared/AI tests cover the supported primitive and deterministic rule/spec
  generation; Renderer/Web tests cover level projection and Observatory text.
- Affected-package regressions, TypeScript, ESLint, Web build, and real Studio
  verification passed. The fresh Sprint 16 Freeze Review is READY FOR FREEZE
  and awaits the Human/CTO decision; this ADR does not authorize Sprint 17.
