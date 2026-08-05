# ADR-0107: Prompt Assembly Trace Diff Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-060  
**Architecture Version:** v0.94

---

## Context

The Prompt Assembly Trace system (WO-S5-058, ADR-0105) introduced `PromptAssemblyTrace` as a unified domain model aggregating all prompt assembly diagnostic artifacts. The trace consumption (WO-S5-059, ADR-0106) wired the trace builder into `DefaultPromptBuilder`, producing a `trace` object at `metadata.promptAssembly.trace`.

However, there is currently **no way to compare two traces**. Without a diff model, consumers cannot determine what changed between a "before" trace and an "after" trace — for example, when comparing traces from different pipeline executions, debugging sessions, or timeline snapshots.

### Problem

1. **No trace comparison** — two `PromptAssemblyTrace` instances cannot be compared
2. **No diff model** — no `PromptAssemblyTraceDiff` type exists
3. **No differ interface** — no abstraction for computing diffs between traces
4. **No default implementation** — no canonical strategy for classifying trace field changes

---

## Decision

### PromptAssemblyTraceDiff

Introduce a pure data interface representing the result of comparing two traces:

```typescript
export interface PromptAssemblyTraceDiff {
  readonly added: readonly string[]
  readonly removed: readonly string[]
  readonly changed: readonly string[]
}
```

- `added` — field names present only in the "after" trace
- `removed` — field names present only in the "before" trace
- `changed` — field names present in both traces but with different values
- All fields are `readonly` arrays of strings (field names only)
- Immutable by convention — all properties are `readonly`

### PromptAssemblyTraceDiffer

Introduce a service interface for computing a diff between two traces:

```typescript
export interface PromptAssemblyTraceDiffer {
  diff(
    before: PromptAssemblyTrace,
    after: PromptAssemblyTrace,
  ): PromptAssemblyTraceDiff
}
```

- Pure: same before/after always produces same diff
- Stateless: no internal state between calls
- Deterministic: no randomness or external factors
- No side effects: does not modify either trace
- Independent: no dependencies on Planner, Runtime, Provider, or Pipeline

### DefaultPromptAssemblyTraceDiffer

The default implementation compares all 9 known trace fields in declaration order:

1. `strategy`
2. `strategySelection`
3. `plan`
4. `optimizedPlan`
5. `planDiff`
6. `snapshot`
7. `inspector`
8. `inspectorRendered`
9. `inspectorExported`

**Classification rules:**

| Condition | Classification |
|-----------|---------------|
| Field missing in before → present in after | `added` |
| Field present in before → missing in after | `removed` |
| Field present in both but different value (`!==`) | `changed` |
| Field present in both with same value (`===`) | No output |

**Output guarantees:**

- Results preserve the field declaration order above
- Result object is `Object.freeze()`'d for runtime immutability
- All arrays within the result are also frozen

**Not modified:**

- `PromptBuilder` — unchanged
- `BuilderOptions` — unchanged
- `Runtime` — unchanged
- `Planner` — unchanged
- `Pipeline` — unchanged
- `AgentLoop` — unchanged
- `PromptAssemblyTrace` — unchanged
- `PromptAssemblyTraceBuilder` — unchanged
- `DefaultPromptAssemblyTraceBuilder` — unchanged
- Prompt output — unchanged (foundation only, no consumption)

---

## Consequences

### Positive

1. **Trace comparison** — two traces can now be compared via a unified diff model
2. **Field-level diff** — added, removed, and changed are classified separately
3. **Deterministic** — same inputs always produce same output
4. **Immutable** — result and arrays are frozen at runtime
5. **Ordered output** — diff arrays preserve field declaration order
6. **Foundation only** — no consumers, no breaking changes, no prompt changes
7. **Zero dependencies** — no dependency on Planner, Runtime, Provider, Pipeline, or AgentLoop

### Negative

None.

### Neutral

1. Value comparison uses reference equality (`!==`) — two different objects with the same content are considered changed
2. Foundation only — not consumed by any production code yet

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All 4547 pass (zero modifications)
- **New tests**: `PromptAssemblyTraceDiffFoundation.test.ts` with 87 test cases
  - Interface contract (7 tests)
  - Empty traces (6 tests)
  - Added fields (7 tests)
  - Removed fields (6 tests)
  - Changed fields (7 tests)
  - Mixed changes (6 tests)
  - Ordering (3 tests)
  - Deterministic (4 tests)
  - Stateless (2 tests)
  - Pure (4 tests)
  - Immutable (5 tests)
  - Exports (9 tests)
  - Architecture compliance (14 tests)
  - Compatibility (4 tests)
  - Edge cases (4 tests)
- **No breaking changes** to any Public API
- **No prompt output changes** — foundation only

---

## References

- WO-S5-058 — Prompt Assembly Trace Foundation (ADR-0105)
- WO-S5-059 — Prompt Assembly Trace Consumption (ADR-0106)
- WO-S5-060 — This Work Order
- `packages/ai/src/strategy/PromptAssemblyTraceDiff.ts`
- `packages/ai/src/strategy/PromptAssemblyTraceDiffer.ts`
- `packages/ai/src/strategy/DefaultPromptAssemblyTraceDiffer.ts`
- `packages/ai/src/__tests__/PromptAssemblyTraceDiffFoundation.test.ts`