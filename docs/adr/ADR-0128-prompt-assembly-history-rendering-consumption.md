# ADR-0128: Prompt Assembly History Renderer Consumption

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-081  
**Architecture Version:** v1.14

---

## Context

`PromptAssemblyHistoryRenderer` (WO-S5-080, ADR-0127) provides human-readable rendering for `PromptAssemblyHistory`. However, this renderer is not yet consumed inside `DefaultPromptBuilder`.

The history itself is already built at Phase 0.9599767 (WO-S5-077, ADR-0124) and stored at `metadata.promptAssembly.history`.

### Problem

1. **No history rendering in metadata** — `historyRendered` is absent from build output
2. **No renderer wiring** — `PromptAssemblyHistoryRenderer` not accepted or invoked by `DefaultPromptBuilder`
3. **No Phase 0.95997685** — no dedicated pipeline phase for history rendering

---

## Decision

### BuilderOptions Extension

Add optional `promptAssemblyHistoryRenderer` field:

```typescript
import type { PromptAssemblyHistoryRenderer }
  from '../strategy/PromptAssemblyHistoryRenderer'

export interface BuilderOptions {
  // ... existing fields ...
  promptAssemblyHistoryRenderer?: PromptAssemblyHistoryRenderer
}
```

Backward compatible — all existing fields, constructors, and callers remain unchanged.

### DefaultPromptBuilder Changes

#### Private field

```typescript
private readonly promptAssemblyHistoryRenderer?: PromptAssemblyHistoryRenderer
```

#### Constructor wiring

BuilderOptions path:

```typescript
this.promptAssemblyHistoryRenderer = opts.promptAssemblyHistoryRenderer
```

Legacy path:

```typescript
this.promptAssemblyHistoryRenderer = undefined
```

#### New Phase 0.95997685

Inserted between Phase 0.9599768 (HistoryDiffer) and Phase 0.96 (StrategyResolver):

```typescript
// Phase 0.95997685: PromptAssemblyHistoryRenderer — render history as human-readable text
let historyRendered: string | undefined
if (history !== undefined && this.promptAssemblyHistoryRenderer !== undefined) {
  historyRendered = this.promptAssemblyHistoryRenderer.render(history)
}
```

#### Metadata storage

```typescript
...(historyRendered !== undefined && historyRendered.length > 0 ? { historyRendered } : {}),
```

Added alongside existing `history` and `historyDiff` fields in the `promptAssembly` metadata block.

### No Consumer Changes

This work item is **consumption only**. No modifications to:
- `PromptAssemblyHistory`
- `PromptAssemblyHistoryBuilder`
- `PromptAssemblyHistoryDiff`
- `PromptAssemblyHistoryDiffer`
- `PromptAssemblyHistoryRenderer`
- `DefaultPromptAssemblyHistoryRenderer`
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

1. **History rendering in metadata** — `historyRendered` available at `metadata.promptAssembly.historyRendered`
2. **Phase 0.95997685** — dedicated phase for history rendering
3. **Backward compatible** — no breaking changes to BuilderOptions or constructor
4. **Metadata only** — no prompt injection, no behavior changes
5. **Additive** — coexists with all existing metadata fields without overwriting
6. **Tested** — 75 tests covering BuilderOptions, renderer invocation, metadata creation, coexistence, determinism, statelessness, purity, legacy constructor, no prompt changes, compatibility, and rendering validation

### Negative

None.

### Risks

None.

---

## Compliance

- **TypeScript 0 errors** — verified
- **ESLint 0 errors** — verified
- **Existing tests all pass** — 6232 tests pass
- **75 new tests pass** — in `PromptAssemblyHistoryRenderingConsumption.test.ts`
- **No prompt changes** — metadata only
- **No metadata overwrites** — additive only
- **No API breaking changes** — backward compatible
- **Architecture version** v1.14 → v1.15