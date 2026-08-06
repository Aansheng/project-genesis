# ADR-0132: Prompt Assembly History Snapshot Consumption

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-085  
**Architecture Version:** v1.18 → v1.19

---

## Context

The Prompt Assembly History Snapshot Foundation (WO-S5-084, ADR-0131) added `PromptAssemblyHistorySnapshot`, `PromptAssemblyHistorySnapshotBuilder`, and `DefaultPromptAssemblyHistorySnapshotBuilder`. However, these are not yet consumed by `DefaultPromptBuilder`.

The history observability chain currently ends at `historyExported` (Phase 0.9599769):

| Phase | Component | Result |
|-------|-----------|--------|
| 0.9599767 | PromptAssemblyHistoryBuilder | history |
| 0.9599768 | PromptAssemblyHistoryDiffer | historyDiff |
| 0.95997685 | PromptAssemblyHistoryRenderer | historyRendered |
| 0.9599769 | PromptAssemblyHistoryExporter | historyExported |

Missing:

| Phase | Component | Result |
|-------|-----------|--------|
| 0.95997695 | PromptAssemblyHistorySnapshotBuilder | historySnapshot |

---

## Decision

### BuilderOptions Extension

Add optional field to `BuilderOptions`:

```typescript
/** Optional PromptAssemblyHistorySnapshotBuilder (defaults to undefined — no history snapshot) */
promptAssemblyHistorySnapshotBuilder?:
  PromptAssemblyHistorySnapshotBuilder
```

### DefaultPromptBuilder Changes

**Imports** — Add:

```typescript
import type {
  PromptAssemblyHistorySnapshotBuilder,
} from '../strategy/PromptAssemblyHistorySnapshotBuilder'
import type {
  PromptAssemblyHistorySnapshot,
} from '../strategy/PromptAssemblyHistorySnapshot'
```

**Private field** — Add:

```typescript
private readonly promptAssemblyHistorySnapshotBuilder?:
  PromptAssemblyHistorySnapshotBuilder
```

**Constructor wiring** — BuilderOptions path wires from `opts.promptAssemblyHistorySnapshotBuilder`. Legacy path sets `undefined`.

### Phase 0.95997695

Inserted between Phase 0.9599769 (HistoryExporter) and Phase 0.96 (PromptAssemblyStrategyResolver):

```typescript
// Phase 0.95997695: PromptAssemblyHistorySnapshotBuilder — build snapshot from history
let historySnapshot: PromptAssemblyHistorySnapshot | undefined
if (history !== undefined && this.promptAssemblyHistorySnapshotBuilder !== undefined) {
  historySnapshot = this.promptAssemblyHistorySnapshotBuilder.build(
    history,
    promptAssemblyMetadata,
  )
}
```

### Metadata Storage

Additive spread:

```typescript
...(historySnapshot !== undefined ? { historySnapshot } : {})
```

Stored at `metadata.promptAssembly.historySnapshot`.

Coexists with all existing fields — never overwrites.

---

## Consequences

### Positive

1. **Complete observability chain** — History now has builder, differ, renderer, exporter, and snapshot
2. **Backward compatible** — optional field, no breaking changes
3. **Metadata only** — no prompt injection, no behavioral changes
4. **Additive** — historySnapshot coexists with all existing promptAssembly fields
5. **Tested** — 80+ tests covering BuilderOptions, builder invocation, metadata creation, metadata coexistence, determinism, statelessness, purity, legacy constructor, no prompt changes, compatibility, and snapshot validation

### Negative

None.

### Risks

None.

---

## Compliance

- **TypeScript 0 errors** — verified
- **ESLint 0 errors** — verified
- **Existing tests all pass** — verified
- **80+ new tests pass** — in `PromptAssemblyHistorySnapshotConsumption.test.ts`
- **historySnapshot stored** at `metadata.promptAssembly.historySnapshot`
- **No prompt changes** — metadata only
- **No API breaking changes** — all additions optional and backward compatible
- **Architecture version** v1.18 → v1.19