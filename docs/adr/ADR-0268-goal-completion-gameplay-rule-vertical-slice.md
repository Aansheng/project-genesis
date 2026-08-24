# ADR-0268 — Goal Completion Gameplay Rule Vertical Slice

- Status: Accepted
- Date: 2026-08-24
- Architecture: v1.153 → v1.154
- Work order: WO-S15-007

## Context

Sprint 15 already has Runtime-owned contact facts, generic rule matching, and
trusted immutable entity mutations. A platformer with `completionMode=goal`
can describe a goal and the deterministic RuleSet can emit `COMPLETE_GOAL`, but
there was no authoritative current-session completion state. The missing slice
must remain small and must not turn a goal entity or Web projection into a
second gameplay authority.

## Decision

Add the narrow Runtime-owned `RuntimeGameplaySessionState` model:

```ts
status: 'active' | 'completed'
```

The only optional metadata is a reliable completion fact already available at
the Runtime boundary, such as `completedByGoalId` and `completedAtTick`.

- A new world/session binds to `active`.
- A trusted `COMPLETE_GOAL` action commits `active → completed`.
- Completion is terminal for that current world/session.
- A repeated completion returns a deterministic `already_completed` / `no_op`
  result and produces no second completion side effect.
- A new world/session binding resets the state to `active`.
- Semantic revision changes and World Evolution that retain the current
  world/session do not reset it.
- Rule-set/event binding remains authoritative: a stale World A event or rule
  cannot mutate World B's session state.

The Goal entity/component remains the world object that can satisfy the generic
contact conditions; it is not session completion truth. Renderer, Web, Pinia,
and Observatory consume the committed Runtime state. No generic
`GameStateManager` is introduced.

The execution path is:

`GameplayEvent → GameplayRule → COMPLETE_GOAL → trusted Runtime session-state
mutation → Renderer/Web/Observatory projection`.

The Runtime loop continues ticking after completion. Stopping the loop,
freezing controls, victory UI, next level, restart, death/game-over, score, XP,
progression, timers, goal deletion, and other generic state infrastructure are
explicitly outside this decision.

## Consequences

The current Studio platformer can expose a truthful completed status without
rebuilding the world or coupling Runtime to Vue/Pinia/Pixi. The state store is
scoped to one Runtime gameplay session and deliberately does not generalize
into a broader gameplay-state framework. Future progression or failure flows
must receive a separate acceptance decision.

## Verification

- Shared/AI capability truth now marks `COMPLETE_GOAL` and `reach-goal` as
  supported only for the validated generic slice.
- Runtime tests cover commit, idempotent no-op, semantic-revision retention,
  world/session rebind, stale binding isolation, and missing-session safety.
- Renderer/Web tests cover committed session-state projection and Observatory
  mapping.
- Affected package TypeScript, ESLint, tests, and the Web build are required;
  Chrome Studio verification must observe contact, committed completion, the
  completed Runtime/Observatory status, continued ticking/control, no duplicate
  completion, and no browser errors.
