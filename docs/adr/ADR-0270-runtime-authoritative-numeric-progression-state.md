# ADR-0270 — Runtime-Authoritative Numeric Progression State

- Status: Accepted
- Date: 2026-08-24
- Architecture: v1.155 → v1.156
- Work order: WO-S16-002

## Context

The Shared gameplay schema already describes the `CHANGE_NUMERIC_STATE` action
and `gameState` references, but the production Runtime had no authoritative
numeric state and rejected the action. This left progression-driven gameplay
without even its smallest executable primitive, while thresholds, levels, and
upgrade selection were still intentionally deferred.

Sprint 16 needs the first generic progression loop without introducing a
genre-specific Runtime or a second gameplay authority. The state must follow
the existing `GameplayEvent → GameplayRule → trusted Runtime action` seam and
remain separate from the existing current-session completion state.

## Decision

Add a small Runtime-owned immutable keyed numeric state scoped to the current
world/session binding:

```ts
values: Readonly<Record<string, number>>
```

The existing `DefaultGameplayRuleExecutor` stages this state together with the
immutable World and session state for each rule. A supported
`CHANGE_NUMERIC_STATE` action applies one finite additive delta to one trimmed,
non-empty key. The state commits only after every action in the rule succeeds;
failed later actions roll back the staged numeric change. Stale bindings cannot
execute, and a new world/session binding starts from an empty state. A semantic
revision change that retains the world/session keeps the state.

The committed state is returned in `ExecutionTickResult`, forwarded by the
existing Renderer visualization loop, and projected by the existing
Observatory Runtime view. It is observable separately from raw gameplay facts,
rule results, World mutations, and `RuntimeGameplaySessionState`.

`experience` is the first measured state key/use case. The capability catalog
promotes only `CHANGE_NUMERIC_STATE`; `NUMBER_COMPARE`, thresholds, level-up,
skills, modifiers, score policy, spawning, waves, and Survivor-specific
behavior remain deferred.

The execution path is:

`GameplayEvent → GameplayRule → CHANGE_NUMERIC_STATE → Runtime numeric state
commit → Renderer/Observatory projection`.

No `SurvivorRuntime`, `XPManager`, `ProgressionManager`, generic workflow
framework, generated code, or offline World Evolution fallback is added.

## Consequences

The production Studio path can now expose truthful, deterministic numeric
progression accumulation while preserving the same Runtime/session through
non-replacing World Evolution. Numeric state is intentionally a primitive, not
a generalized gameplay-state manager. Threshold and level semantics require a
separate measured decision.

## Verification

- Runtime tests cover execution, accumulation, semantic-revision retention,
  world/session rebinding, stale isolation, finite-input validation, and atomic
  rollback.
- Renderer and Web tests cover committed numeric-state publication and the
  Observatory Runtime projection.
- Shared/AI capability and candidate status tests cover the promoted action.
- Affected-package regressions passed on 2026-08-24: Shared 207, AI 9,402,
  Runtime 689, Renderer 485, and Web 3,528 tests. Direct TypeScript checks,
  package ESLint with 0 errors, and the Web build passed; the root Turbo
  typecheck wrapper remains blocked by the managed TLS/keychain limitation.
- Studio verification observed a real committed `experience: 1`, retention
  across non-replacing evolution in `world-3`, reset to unavailable in new
  `world-4`, and no browser warning/error entries.
