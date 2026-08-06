# ADR-0123: Prompt Assembly History Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-076  
**Architecture Version:** v1.10

---

## Context

The Prompt Assembly architecture already has `PromptAssemblyTrace` (WO-S5-058, ADR-0105) and `PromptAssemblyTimeline` (WO-S5-066, ADR-0113) which represents a collection of traces with additional metadata. However, there is no **dedicated history abstraction** that focuses purely on the sequential trace collection.

The existing `PromptAssemblyTimeline` is a richer model with timeline-specific metadata (diff, rendered, exported, snapshot). A simpler `PromptAssemblyHistory` is needed for consumers that only require the raw trace sequence without the full timeline infrastructure.

### Problem

1. **No dedicated history model** — no pure trace sequence abstraction
2. **No history builder** — no abstraction for constructing history from traces
3. **No default implementation** — no canonical way to build immutable indexed history entries

---

## Decision

### PromptAssemblyHistoryEntry

A single entry in a history, pairing a zero-based index with a trace:

```typescript
export interface PromptAssemblyHistoryEntry {
  readonly index: number
  readonly trace: PromptAssemblyTrace
}
```

### PromptAssemblyHistory

The history container:

```typescript
export interface PromptAssemblyHistory {
  readonly entries: readonly PromptAssemblyHistoryEntry[]
}
```

### PromptAssemblyHistoryBuilder

Service interface for building history from traces:

```typescript
export interface PromptAssemblyHistoryBuilder {
  build(traces: readonly PromptAssemblyTrace[]): PromptAssemblyHistory
}
```

### DefaultPromptAssemblyHistoryBuilder

Default implementation that builds immutable frozen history:

```typescript
build(traces) {
  return Object.freeze({
    entries: Object.freeze(
      traces.map((trace, index) =>
        Object.freeze({ index, trace }),
      ),
    ),
  })
}
```

Properties:
- **Pure:** same traces always produces same history
- **Stateless:** no internal state between calls
- **Deterministic:** no randomness or external factors
- **Immutable:** all objects are frozen (history, entries array, each entry)
- No dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline

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

1. **Dedicated history model** — lightweight trace sequence abstraction
2. **Frozen immutability** — all objects frozen to prevent mutation
3. **Foundation complete** — history infrastructure exists for future consumption
4. **Backward compatible** — no breaking changes to any public API
5. **Tested** — 97 tests covering interface contract, empty history, single entry, multiple entries, large history, order preservation, determinism, statelessness, purity, immutability, exports, architecture compliance, compatibility, and edge cases

### Negative

None.

### Risks

None.

---

## Compliance

- **TypeScript 0 errors** — verified
- **ESLint 0 errors** — verified
- **Existing tests all pass** — verified
- **97 new tests pass** — 97 tests in `PromptAssemblyHistoryFoundation.test.ts`
- **No prompt changes** — foundation only
- **No metadata changes** — foundation only
- **No API breaking changes** — foundation only
- **Architecture version** v1.09 → v1.10