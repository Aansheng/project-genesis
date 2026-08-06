# ADR-0130: Prompt Assembly History Export Consumption

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-083  
**Architecture Version:** v1.16 → v1.17

---

## Context

`PromptAssemblyHistoryExporter` (WO-S5-082, ADR-0129) provides JSON export for `PromptAssemblyHistory`. However, this exporter is not yet consumed inside `DefaultPromptBuilder`.

The history itself is already built at Phase 0.9599767 (WO-S5-077, ADR-0124) and stored at `metadata.promptAssembly.history`.

### Problem

1. **No history export in metadata** — `historyExported` is absent from build output
2. **No exporter wiring** — `PromptAssemblyHistoryExporter` not accepted or invoked by `DefaultPromptBuilder`
3. **No Phase 0.9599769** — no dedicated pipeline phase for history export

---

## Decision

### BuilderOptions Extension

Add optional `promptAssemblyHistoryExporter` field:

```typescript
import type {
  PromptAssemblyHistoryExporter,
} from '../strategy/PromptAssemblyHistoryExporter'

export interface BuilderOptions {
  // ... existing fields ...
  promptAssemblyHistoryExporter?:
    PromptAssemblyHistoryExporter
}
```

Backward compatible — all existing fields, constructors, and callers remain unchanged.

### DefaultPromptBuilder Changes

#### Private field

```typescript
private readonly
promptAssemblyHistoryExporter?:
  PromptAssemblyHistoryExporter
```

#### Constructor wiring

BuilderOptions path:

```typescript
this.promptAssemblyHistoryExporter =
  opts.promptAssemblyHistoryExporter
```

Legacy path:

```typescript
this.promptAssemblyHistoryExporter =
  undefined
```

#### New Phase 0.9599769

Inserted between Phase 0.95997685 (HistoryRenderer) and Phase 0.96 (StrategyResolver):

```typescript
// Phase 0.9599769: PromptAssemblyHistoryExporter — export history as JSON string
let historyExported: string | undefined
if (history !== undefined && this.promptAssemblyHistoryExporter !== undefined) {
  historyExported = this.promptAssemblyHistoryExporter.export(history)
}
```

#### Metadata storage

```typescript
...(historyExported !== undefined ? { historyExported } : {}),
```

Added alongside existing `history`, `historyDiff`, and `historyRendered` fields in the `promptAssembly` metadata block.

### No Consumer Changes

This work item is **consumption only**. No modifications to:
- `PromptAssemblyHistory`
- `PromptAssemblyHistoryBuilder`
- `PromptAssemblyHistoryDiff`
- `PromptAssemblyHistoryDiffer`
- `PromptAssemblyHistoryRenderer`
- `DefaultPromptAssemblyHistoryRenderer`
- `PromptAssemblyHistoryExporter`
- `DefaultPromptAssemblyHistoryExporter`
- `PromptRenderer`
- `PromptCompression`
- `Runtime`
- `Planner`
- `Pipeline`
- `AgentLoop`

No prompt changes. No metadata overwrites.

---

## Consequences

### Positive

1. **History export in metadata** — `historyExported` available at `metadata.promptAssembly.historyExported`
2. **Phase 0.9599769** — dedicated phase for history export
3. **Backward compatible** — no breaking changes to BuilderOptions or constructor
4. **Metadata only** — no prompt injection, no behavior changes
5. **Additive** — coexists with all existing metadata fields without overwriting
6. **Tested** — 86 tests covering BuilderOptions, exporter invocation, metadata creation, coexistence, determinism, statelessness, purity, legacy constructor, no prompt changes, compatibility, and export validation

### Negative

None.

### Risks

None.

---

## Compliance

- **TypeScript 0 errors** — verified
- **ESLint 0 errors** — verified
- **Existing tests all pass** — verified
- **86 new tests pass** — in `PromptAssemblyHistoryExportConsumption.test.ts`
- **No history changes** — consumption only
- **No prompt changes** — metadata only
- **No metadata overwrites** — additive only
- **No API breaking changes** — backward compatible
- **Architecture version** v1.16 → v1.17