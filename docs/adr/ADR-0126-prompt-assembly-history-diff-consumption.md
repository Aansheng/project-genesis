# ADR-0126: Prompt Assembly History Diff Consumption

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-079  
**Architecture Version:** v1.12

---

## Context

`PromptAssemblyHistoryDiff` (WO-S5-078, ADR-0125) provides the diff infrastructure for comparing two `PromptAssemblyHistory` instances. However, this diff infrastructure is not yet consumed inside `DefaultPromptBuilder`.

The history itself is already built at Phase 0.9599767 (WO-S5-077, ADR-0124) and stored at `metadata.promptAssembly.history`.

### Problem

1. **No history diff in metadata** — `historyDiff` is absent from build output
2. **No differ wiring** — `PromptAssemblyHistoryDiffer` not accepted or invoked by `DefaultPromptBuilder`
3. **No Phase 0.9599768** — no dedicated pipeline phase for history diff generation

---

## Decision

### BuilderOptions Extension

Add optional `promptAssemblyHistoryDiffer` field:

```typescript
import type { PromptAssemblyHistoryDiffer }
  from '../strategy/PromptAssemblyHistoryDiffer'

export interface BuilderOptions {
  // ... existing fields ...
  promptAssemblyHistoryDiffer?: PromptAssemblyHistoryDiffer
}
```

Backward compatible — all existing fields, constructors, and callers remain unchanged.

### DefaultPromptBuilder Changes

#### Private field

```typescript
private readonly promptAssemblyHistoryDiffer?: PromptAssemblyHistoryDiffer
```

#### Constructor wiring

BuilderOptions path:

```typescript
this.promptAssemblyHistoryDiffer = opts.promptAssemblyHistoryDiffer
```

Legacy path:

```typescript
this.promptAssemblyHistoryDiffer = undefined
```

#### New Phase 0.9599768

Inserted between Phase 0.9599767 (HistoryBuilder) and Phase 0.96 (StrategyResolver):

```typescript
// Phase 0.9599768: PromptAssemblyHistoryDiffer — diff history against empty baseline
let historyDiff: PromptAssemblyHistoryDiff | undefined
if (history !== undefined && this.promptAssemblyHistoryDiffer !== undefined) {
  historyDiff = this.promptAssemblyHistoryDiffer.diff(
    { entries: [] },
    history,
  )
}
```

#### Metadata storage

```typescript
...(historyDiff !== undefined ? { historyDiff } : {}),
```

Added alongside existing `history` field in the `promptAssembly` metadata block.

### No Consumer Changes

This work item is **consumption only**. No modifications to:
- `PromptAssemblyHistory`
- `PromptAssemblyHistoryBuilder`
- `PromptAssemblyHistoryDiff`
- `PromptAssemblyHistoryDiffer`
- `DefaultPromptAssemblyHistoryDiffer`
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

1. **History diff in metadata** — `historyDiff` available at `metadata.promptAssembly.historyDiff`
2. **Phase 0.9599768** — dedicated phase for history diff generation
3. **Backward compatible** — no breaking changes to BuilderOptions or constructor
4. **Metadata only** — no prompt injection, no behavior changes
5. **Additive** — coexists with all existing metadata fields without overwriting
6. **Tested** — 81 tests covering BuilderOptions, differ invocation, metadata creation, coexistence, determinism, statelessness, purity, legacy constructor, no prompt changes, compatibility, and diff validation

### Negative

None.

### Risks

None.

---

## Compliance

- **TypeScript 0 errors** — verified
- **ESLint 0 errors** — verified
- **Existing tests all pass** — 6067 tests pass
- **81 new tests pass** — in `PromptAssemblyHistoryDiffConsumption.test.ts`
- **No prompt changes** — metadata only
- **No metadata overwrites** — additive only
- **No API breaking changes** — backward compatible
- **Architecture version** v1.12 → v1.13