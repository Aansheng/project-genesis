# ADR-0131: Prompt Assembly History Snapshot Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-084  
**Architecture Version:** v1.17 → v1.18

---

## Context

The Prompt Assembly History architecture already has `PromptAssemblyHistory` (WO-S5-076, ADR-0123), `PromptAssemblyHistoryBuilder` (WO-S5-076, ADR-0123), `PromptAssemblyHistoryDiff` and `PromptAssemblyHistoryDiffer` (WO-S5-078, ADR-0125), `PromptAssemblyHistoryRenderer` (WO-S5-080, ADR-0127), and `PromptAssemblyHistoryExporter` (WO-S5-082, ADR-0129). However, there is no **snapshot abstraction** for the history.

### Problem

1. **No snapshot interface** — no abstraction for building a condensed summary of `PromptAssemblyHistory`
2. **No snapshot builder interface** — no contract for constructing snapshots from a full history and optional metadata
3. **No default implementation** — no canonical way to produce a lightweight summary with entry count, first/last strategy, strategies list, and optional rendered/exported representations

---

## Decision

### PromptAssemblyHistorySnapshot

A new interface in `packages/ai/src/strategy/PromptAssemblyHistorySnapshot.ts`:

```typescript
export interface PromptAssemblyHistorySnapshot {
  readonly entryCount?: number
  readonly firstStrategy?: string
  readonly lastStrategy?: string
  readonly strategies?: readonly string[]
  readonly rendered?: string
  readonly exported?: string
}
```

### PromptAssemblyHistorySnapshotBuilder

A new interface in `packages/ai/src/strategy/PromptAssemblyHistorySnapshotBuilder.ts`:

```typescript
export interface PromptAssemblyHistorySnapshotBuilder {
  build(
    history: PromptAssemblyHistory,
    metadata?: Record<string, unknown>,
  ): PromptAssemblyHistorySnapshot
}
```

### DefaultPromptAssemblyHistorySnapshotBuilder

A default implementation in `packages/ai/src/strategy/DefaultPromptAssemblyHistorySnapshotBuilder.ts`.

Extraction rules:

| Field | Source | Empty behavior |
|-------|--------|----------------|
| `entryCount` | `history.entries.length` | `undefined` |
| `firstStrategy` | First entry strategy name | `undefined` |
| `lastStrategy` | Last entry strategy name | `undefined` |
| `strategies` | Ordered strategy list from all entries | `undefined` |
| `rendered` | `metadata.historyRendered` (string only) | omitted |
| `exported` | `metadata.historyExported` (string only) | omitted |

Strategy name extraction:
- Extracted from `entry.trace?.strategy` as `{ name?: string }`
- When strategy is an object with a string `name`, that name is used
- Otherwise `"unknown"` is used

Metadata extraction:
- Only `historyRendered` and `historyExported` are recognized
- Both are extracted **only when they are strings** (unlike the Timeline variant which converts to string)
- Unknown metadata keys are silently ignored

Properties:
- **Pure:** same history + metadata always produces same snapshot
- **Stateless:** no internal state between calls
- **Deterministic:** no randomness or external factors
- **Immutable:** never modifies the input history or metadata
- **Zero dependencies** on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline

### No Consumer Changes

This work item is **foundation only**. No changes to:
- `PromptBuilder`
- `BuilderOptions`
- `DefaultPromptBuilder`
- `PromptAssemblyHistory`
- `PromptAssemblyHistoryBuilder`
- `DefaultPromptAssemblyHistoryBuilder`
- `PromptAssemblyHistoryDiff`
- `PromptAssemblyHistoryDiffer`
- `DefaultPromptAssemblyHistoryDiffer`
- `PromptAssemblyHistoryRenderer`
- `DefaultPromptAssemblyHistoryRenderer`
- `PromptAssemblyHistoryExporter`
- `DefaultPromptAssemblyHistoryExporter`
- `Runtime`
- `Planner`
- `Pipeline`
- `AgentLoop`

No metadata changes. No prompt changes.

---

## Consequences

### Positive

1. **Snapshot capability** — `PromptAssemblyHistorySnapshot` provides a clean abstraction for condensed history summaries
2. **Builder contract** — `PromptAssemblyHistorySnapshotBuilder` defines a clear interface for constructing snapshots
3. **Default implementation** — `DefaultPromptAssemblyHistorySnapshotBuilder` provides canonical extraction rules
4. **Metadata extraction with type safety** — `historyRendered` and `historyExported` are only extracted when they are strings
5. **Foundation complete** — snapshot infrastructure exists for future consumption
6. **Backward compatible** — no breaking changes to any public API
7. **Tested** — 100+ tests covering interface contract, empty history, single entry, multiple entries, metadata extraction for rendered/exported/both/unknown, determinism, statelessness, purity, immutability, exports, architecture compliance, compatibility, and edge cases

### Negative

None.

### Risks

None.

---

## Compliance

- **TypeScript 0 errors** — verified
- **ESLint 0 errors** — verified
- **Existing tests all pass** — verified
- **100+ new tests pass** — in `PromptAssemblyHistorySnapshotFoundation.test.ts`
- **No PromptBuilder changes** — foundation only
- **No BuilderOptions changes** — foundation only
- **No metadata changes** — foundation only
- **No prompt changes** — foundation only
- **No API breaking changes** — foundation only
- **Architecture version** v1.17 → v1.18