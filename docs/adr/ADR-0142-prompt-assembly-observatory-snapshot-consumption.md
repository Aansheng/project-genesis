# ADR-0142: Prompt Assembly Observatory Snapshot Consumption

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-095  
**Architecture Version:** v1.28 → v1.29

---

## Context

`PromptAssemblyObservatorySnapshotBuilder` (WO-S5-094, ADR-0141) provides condensed summary building for `PromptAssemblyObservatory`. However, this builder is not yet consumed inside `DefaultPromptBuilder`.

The observatory chain is currently: builder at Phase 0.959977, differ at Phase 0.9599775, renderer at Phase 0.95997775, exporter at Phase 0.9599778.

### Problem

1. **No observatory snapshot in metadata** — `observatorySnapshot` is absent from build output
2. **No snapshot builder wiring** — `PromptAssemblyObservatorySnapshotBuilder` not accepted or invoked by `DefaultPromptBuilder`
3. **No Phase 0.9599779** — no dedicated pipeline phase for observatory snapshot building

---

## Decision

### BuilderOptions Extension

Add optional `promptAssemblyObservatorySnapshotBuilder` field:

```typescript
import type { PromptAssemblyObservatorySnapshotBuilder }
  from '../strategy'

export interface BuilderOptions {
  // ... existing fields ...
  promptAssemblyObservatorySnapshotBuilder?: PromptAssemblyObservatorySnapshotBuilder
}
```

Backward compatible — all existing fields, constructors, and callers remain unchanged.

### DefaultPromptBuilder Changes

#### Private field

```typescript
private readonly promptAssemblyObservatorySnapshotBuilder?:
  PromptAssemblyObservatorySnapshotBuilder
```

#### Constructor wiring

BuilderOptions path:

```typescript
this.promptAssemblyObservatorySnapshotBuilder =
  opts.promptAssemblyObservatorySnapshotBuilder
```

Legacy path:

```typescript
this.promptAssemblyObservatorySnapshotBuilder = undefined
```

#### New Phase 0.9599779

Inserted between Phase 0.9599778 (ObservatoryExporter) and Phase 0.96 (StrategyResolver):

```typescript
// Phase 0.9599779: PromptAssemblyObservatorySnapshotBuilder — build condensed observatory snapshot
let observatorySnapshot:
  | PromptAssemblyObservatorySnapshot
  | undefined

if (
  observatory !== undefined &&
  this.promptAssemblyObservatorySnapshotBuilder !== undefined
) {
  observatorySnapshot =
    this.promptAssemblyObservatorySnapshotBuilder.build(
      observatory,
      promptAssemblyMetadata,
    )
}
```

The snapshot builder receives both the built observatory and the `promptAssemblyMetadata` object (consistent with the history snapshot consumption at Phase 0.95997695).

#### Metadata storage

```typescript
...(observatorySnapshot !== undefined
  ? { observatorySnapshot }
  : {}),
```

Added alongside existing `observatory`, `observatoryDiff`, `observatoryRendered`, and `observatoryExported` fields in the `promptAssembly` metadata block. Uses additive spread pattern — never overwrites existing fields.

### No Consumer Changes

This work item is **consumption only**. No modifications to:
- `PromptAssemblyObservatory`
- `PromptAssemblyObservatoryBuilder`
- `PromptAssemblyObservatoryDiff`
- `PromptAssemblyObservatoryDiffer`
- `PromptAssemblyObservatoryRenderer`
- `PromptAssemblyObservatoryExporter`
- `PromptAssemblyObservatorySnapshot`
- `PromptAssemblyObservatorySnapshotBuilder`
- `DefaultPromptAssemblyObservatorySnapshotBuilder`
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

1. **Observatory snapshot in metadata** — `observatorySnapshot` available at `metadata.promptAssembly.observatorySnapshot`
2. **Phase 0.9599779** — dedicated phase for observatory snapshot building, completing the observatory chain (build → diff → render → export → snapshot)
3. **Backward compatible** — no breaking changes to BuilderOptions or constructor
4. **Metadata only** — no prompt injection, no behavior changes
5. **Additive** — coexists with `observatory`, `observatoryDiff`, `observatoryRendered`, `observatoryExported`, and all existing metadata fields without overwriting
6. **Tested** — 81 tests covering BuilderOptions, builder invocation, metadata creation, coexistence, determinism, statelessness, purity, legacy constructor, no prompt changes, compatibility, and observatory snapshot validation

### Negative

None.

### Risks

None.

---

## Compliance

- **TypeScript 0 errors** — verified
- **ESLint 0 errors** — verified
- **Existing tests all pass** — verified
- **81 new tests pass** — in `PromptAssemblyObservatorySnapshotConsumption.test.ts`
- **No prompt changes** — metadata only
- **No metadata overwrites** — additive only
- **No API breaking changes** — backward compatible
- **Architecture version** v1.28 → v1.29

---

## Completion Condition

This work order completes the entire Sprint 5 Prompt Observability Layer.

- **Sprint 5 = 100% complete**
- **Next milestone:** Sprint 6 — Observatory UI