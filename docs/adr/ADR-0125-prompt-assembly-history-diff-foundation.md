# ADR-0125: Prompt Assembly History Diff Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-078  
**Architecture Version:** v1.11

---

## Context

The Prompt Assembly architecture already has `PromptAssemblyHistory` (WO-S5-076, ADR-0123) which captures the sequential history of prompt assembly traces. However, there is no **dedicated diff abstraction** for comparing two `PromptAssemblyHistory` instances.

### Problem

1. **No history diff model** — no way to express what changed between two histories
2. **No history differ interface** — no abstraction for computing history diffs
3. **No default implementation** — no canonical O(1) lookup-based history differ

---

## Decision

### PromptAssemblyHistoryDiff

A pure data structure representing the differences between two history instances:

```typescript
export interface PromptAssemblyHistoryDiff {
  readonly added: readonly number[]
  readonly removed: readonly number[]
  readonly changed: readonly number[]
}
```

- **added**: entry indexes present in "after" but not in "before"
- **removed**: entry indexes present in "before" but not in "after"
- **changed**: entry indexes present in both but with different trace references (`!==`)

### PromptAssemblyHistoryDiffer

Service interface for computing diffs:

```typescript
export interface PromptAssemblyHistoryDiffer {
  diff(
    before: PromptAssemblyHistory,
    after: PromptAssemblyHistory,
  ): PromptAssemblyHistoryDiff
}
```

### DefaultPromptAssemblyHistoryDiffer

Default implementation with O(1) lookup via `Map<number, PromptAssemblyHistoryEntry>`:

```typescript
export class DefaultPromptAssemblyHistoryDiffer
  implements PromptAssemblyHistoryDiffer
```

Algorithm:
1. Build `Map` from each history for O(1) entry retrieval
2. **Added**: iterate "after" entries, check if index is missing in "before" map
3. **Removed**: iterate "before" entries, check if index is missing in "after" map
4. **Changed**: iterate "before" entries, check if matching index in "after" has different trace reference

Ordering rules:
- **added**: preserves encounter order from "after" history
- **removed**: preserves encounter order from "before" history
- **changed**: preserves encounter order from "before" history
- No sorting is applied

Properties:
- **Pure:** same before/after always produces same diff
- **Stateless:** no internal state between calls
- **Deterministic:** no randomness or external factors
- **Immutable:** result and all arrays are `Object.frozen`
- **No sorting:** preserves encounter order from source histories
- **Zero dependencies** on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline

### No Consumer Changes

This work item is **foundation only**. No changes to:
- `PromptBuilder`
- `BuilderOptions`
- `DefaultPromptBuilder`
- `Runtime`
- `Planner`
- `Pipeline`
- `AgentLoop`
- Any existing PromptAssembly types or implementations

No metadata changes. No prompt changes.

---

## Consequences

### Positive

1. **Dedicated history diff model** — lightweight index-level diff for histories
2. **O(1) lookup** — efficient comparison using `Map<number, PromptAssemblyHistoryEntry>`
3. **Preserved ordering** — added/removed/changed arrays reflect source encounter order
4. **Frozen immutability** — result and all arrays frozen to prevent mutation
5. **Foundation complete** — history diff infrastructure exists for future consumption
6. **Backward compatible** — no breaking changes to any public API
7. **Tested** — 111 tests covering interface contract, diff structure, added/removed/changed entries, mixed changes, unchanged histories, empty histories, ordering rules, determinism, statelessness, purity, immutability, exports, architecture compliance, compatibility, edge cases, and O(1) lookup verification

### Negative

None.

### Risks

None.

---

## Compliance

- **TypeScript 0 errors** — verified
- **ESLint 0 errors** — verified
- **Existing tests all pass** — 5986 tests pass
- **111 new tests pass** — in `PromptAssemblyHistoryDiffFoundation.test.ts`
- **No prompt changes** — foundation only
- **No metadata changes** — foundation only
- **No API breaking changes** — foundation only
- **Architecture version** v1.11 → v1.12