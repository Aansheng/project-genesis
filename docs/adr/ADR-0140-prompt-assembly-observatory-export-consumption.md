# ADR-0140: Prompt Assembly Observatory Export Consumption

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-093  
**Architecture Version:** v1.26 → v1.27

---

## Context

`PromptAssemblyObservatoryExporter` (WO-S5-092, ADR-0139) provides serialized string export for `PromptAssemblyObservatory`. However, this exporter is not yet consumed inside `DefaultPromptBuilder`.

The observatory itself is already built at Phase 0.959977 (WO-S5-087, ADR-0134), diffed at Phase 0.9599775 (WO-S5-089, ADR-0136), and rendered at Phase 0.95997775 (WO-S5-091, ADR-0138).

### Problem

1. **No observatory export in metadata** — `observatoryExported` is absent from build output
2. **No exporter wiring** — `PromptAssemblyObservatoryExporter` not accepted or invoked by `DefaultPromptBuilder`
3. **No Phase 0.9599778** — no dedicated pipeline phase for observatory export

---

## Decision

### BuilderOptions Extension

Add optional `promptAssemblyObservatoryExporter` field:

```typescript
import type { PromptAssemblyObservatoryExporter }
  from '../strategy/PromptAssemblyObservatoryExporter'

export interface BuilderOptions {
  // ... existing fields ...
  promptAssemblyObservatoryExporter?: PromptAssemblyObservatoryExporter
}
```

Backward compatible — all existing fields, constructors, and callers remain unchanged.

### DefaultPromptBuilder Changes

#### Private field

```typescript
private readonly promptAssemblyObservatoryExporter?:
  PromptAssemblyObservatoryExporter
```

#### Constructor wiring

BuilderOptions path:

```typescript
this.promptAssemblyObservatoryExporter =
  opts.promptAssemblyObservatoryExporter
```

Legacy path:

```typescript
this.promptAssemblyObservatoryExporter = undefined
```

#### New Phase 0.9599778

Inserted between Phase 0.95997775 (ObservatoryRenderer) and Phase 0.96 (StrategyResolver):

```typescript
// Phase 0.9599778: PromptAssemblyObservatoryExporter — export observatory as serialized JSON
let observatoryExported: string | undefined

if (
  observatory !== undefined &&
  this.promptAssemblyObservatoryExporter !== undefined
) {
  const exported =
    this.promptAssemblyObservatoryExporter.export(
      observatory,
    )

  if (exported.length > 0) {
    observatoryExported = exported
  }
}
```

Export executes only when both the observatory is present and the exporter is configured. Empty export output is ignored (not stored).

#### Metadata storage

```typescript
...(observatoryExported !== undefined
  ? { observatoryExported }
  : {}),
```

Added alongside existing `observatory`, `observatoryDiff`, and `observatoryRendered` fields in the `promptAssembly` metadata block. Uses additive spread pattern — never overwrites existing fields.

### No Consumer Changes

This work item is **consumption only**. No modifications to:
- `PromptAssemblyObservatory`
- `PromptAssemblyObservatoryBuilder`
- `PromptAssemblyObservatoryDiff`
- `PromptAssemblyObservatoryDiffer`
- `PromptAssemblyObservatoryRenderer`
- `PromptAssemblyObservatoryExporter`
- `DefaultPromptAssemblyObservatoryExporter`
- `PromptRenderer`
- `PromptCompression`
- `Runtime`
- `Planner`
- `Pipeline`
- `AgentLoop`

No prompt changes. No metadata overwrites. Metadata only.

---

## Consequences

### Positive

1. **Observatory export in metadata** — `observatoryExported` available at `metadata.promptAssembly.observatoryExported`
2. **Phase 0.9599778** — dedicated phase for observatory export
3. **Backward compatible** — no breaking changes to BuilderOptions or constructor
4. **Metadata only** — no prompt injection, no behavior changes
5. **Additive** — coexists with `observatory`, `observatoryDiff`, `observatoryRendered`, and all existing metadata fields without overwriting
6. **Deterministic** — same observatory produces same exported string
7. **Tested** — 81 tests covering BuilderOptions, exporter invocation, metadata creation, coexistence, determinism, statelessness, purity, legacy constructor, no prompt changes, compatibility, and observatory export validation

### Negative

None.

### Risks

None.

---

## Compliance

- **TypeScript 0 errors** — verified
- **ESLint 0 errors** — verified
- **Existing tests all pass** — verified
- **81 new tests pass** — in `PromptAssemblyObservatoryExportConsumption.test.ts`
- **No prompt changes** — metadata only
- **No metadata overwrites** — additive only
- **No API breaking changes** — backward compatible
- **Architecture version** v1.26 → v1.27