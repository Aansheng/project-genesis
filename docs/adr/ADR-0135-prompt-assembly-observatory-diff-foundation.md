# ADR-0135: Prompt Assembly Observatory Diff Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-088  
**Architecture Version:** v1.21 → v1.22

---

## Context

PromptAssemblyObservatory has become the unified aggregation object for all prompt assembly observability data, consolidating six artifacts: trace, timeline, history, traceSnapshot, timelineSnapshot, and historySnapshot.

Following the established diff pattern used by PromptAssemblyTraceDiff / PromptAssemblyTraceDiffer, PromptAssemblyTimelineDiff / PromptAssemblyTimelineDiffer, PromptAssemblyHistoryDiff / PromptAssemblyHistoryDiffer, and PromptAssemblyPlanDiff / PromptAssemblyPlanDiffer, the observatory layer now requires diff capabilities.

### Problem

1. **No observatory diff** — there is no mechanism to compare two PromptAssemblyObservatory instances
2. **No diff interface** — no contract defining what an observatory diff looks like
3. **No default differ** — no canonical implementation for comparing observatories

---

## Decision

### PromptAssemblyObservatoryDiff

A new interface in `packages/ai/src/strategy/PromptAssemblyObservatoryDiff.ts`:

```typescript
export interface PromptAssemblyObservatoryDiff {
  readonly added: readonly string[]
  readonly removed: readonly string[]
  readonly changed: readonly string[]
}
```

Follows the same shape as PromptAssemblyTraceDiff, PromptAssemblyTimelineDiff, and PromptAssemblyHistoryDiff — pure data, no behavior.

### PromptAssemblyObservatoryDiffer

A new interface in `packages/ai/src/strategy/PromptAssemblyObservatoryDiffer.ts`:

```typescript
export interface PromptAssemblyObservatoryDiffer {
  diff(
    before: PromptAssemblyObservatory,
    after: PromptAssemblyObservatory,
  ): PromptAssemblyObservatoryDiff
}
```

Single method contract — pure, stateless, deterministic.

### DefaultPromptAssemblyObservatoryDiffer

A default implementation in `packages/ai/src/strategy/DefaultPromptAssemblyObservatoryDiffer.ts`.

Compares two PromptAssemblyObservatory instances by iterating over six known observatory fields:

1. `trace`
2. `timeline`
3. `history`
4. `traceSnapshot`
5. `timelineSnapshot`
6. `historySnapshot`

**Classification rules:**

- **Added** — field present in "after" but not in "before" → added
- **Removed** — field present in "before" but not in "after" → removed
- **Changed** — field present in both but with different value (using `!==`) → changed
- **Equal** — field present in both with same value → no output

**Algorithm:**
- Iterate known fields in declaration order
- For each field, check presence in before/after using `undefined` check
- Classify into added, removed, or changed
- Results preserve field declaration order

**Properties:**
- **Pure:** same before/after always produces same diff
- **Stateless:** no internal state between calls
- **Deterministic:** no randomness or external factors
- **Immutable:** never modifies either input; result and arrays are Object.frozen
- **Zero dependencies** on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline

### No Consumer Changes

This work item is **foundation only**. No changes to:
- `DefaultPromptBuilder`
- `BuilderOptions`
- `PromptRenderer`
- `PromptCompression`
- `Planner`
- `Runtime`
- `Pipeline`
- `AgentLoop`

No metadata changes. No prompt changes.

---

## Consequences

### Positive

1. **Observatory diff capability** — PromptAssemblyObservatoryDiff provides a structured diff result for observatory comparison
2. **Differ contract** — PromptAssemblyObservatoryDiffer defines a clear interface for differencing
3. **Default implementation** — DefaultPromptAssemblyObservatoryDiffer provides canonical comparison behavior
4. **Consistent pattern** — follows same design as PromptAssemblyTraceDiff, PromptAssemblyTimelineDiff, PromptAssemblyHistoryDiff
5. **Foundation complete** — observatory diff infrastructure exists for future consumption
6. **Backward compatible** — no breaking changes to any public API
7. **Tested** — 113+ tests covering interface contract, empty observatory, added/removed/changed per field, mixed changes, ordering, determinism, statelessness, purity, immutability, exports, architecture compliance, compatibility, and edge cases

### Negative

None.

### Risks

None.

---

## Compliance

- **TypeScript 0 errors** — verified
- **ESLint 0 errors** — verified
- **Existing tests all pass** — verified
- **113+ new tests pass** — in `PromptAssemblyObservatoryDiffFoundation.test.ts`
- **No PromptBuilder changes** — foundation only
- **No BuilderOptions changes** — foundation only
- **No metadata changes** — foundation only
- **No prompt changes** — foundation only
- **No API breaking changes** — foundation only
- **Architecture version** v1.21 → v1.22