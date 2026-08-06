# ADR-0134: Prompt Assembly Observatory Consumption

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-087  
**Architecture Version:** v1.20 → v1.21

---

## Context

The Prompt Assembly Observatory Foundation (WO-S5-086, ADR-0133) added `PromptAssemblyObservatory`, `PromptAssemblyObservatoryBuilder`, and `DefaultPromptAssemblyObservatoryBuilder`. However, these are not yet consumed by `DefaultPromptBuilder`.

The observatory currently aggregates all six observability artifacts (trace, timeline, history, traceSnapshot, timelineSnapshot, historySnapshot) but needs to be wired into the PromptBuilder pipeline.

---

## Decision

### BuilderOptions Extension

Add optional field to `BuilderOptions`:

```typescript
/** Optional PromptAssemblyObservatoryBuilder (defaults to undefined — no observatory) */
promptAssemblyObservatoryBuilder?:
  PromptAssemblyObservatoryBuilder
```

### DefaultPromptBuilder Changes

**Imports** — Add:

```typescript
import type { PromptAssemblyObservatoryBuilder } from '../strategy/PromptAssemblyObservatoryBuilder'
import type { PromptAssemblyObservatory } from '../strategy/PromptAssemblyObservatory'
```

**Private field** — Add:

```typescript
private readonly promptAssemblyObservatoryBuilder?:
  PromptAssemblyObservatoryBuilder
```

**Constructor wiring** — BuilderOptions path wires from `opts.promptAssemblyObservatoryBuilder`. Legacy path sets `undefined`.

### Phase 0.959977

Inserted between Phase 0.95997695 (HistorySnapshotBuilder) and Phase 0.96 (PromptAssemblyStrategyResolver):

```typescript
// Phase 0.959977: PromptAssemblyObservatoryBuilder — build unified observatory
let observatory: PromptAssemblyObservatory | undefined
if (this.promptAssemblyObservatoryBuilder !== undefined) {
  observatory = this.promptAssemblyObservatoryBuilder.build({
    trace,
    timeline,
    history,
    traceSnapshot: promptAssemblySnapshot,
    timelineSnapshot,
    historySnapshot,
  })
}
```

All six artifacts are passed to the builder, which aggregates them into the unified observatory.

### Metadata Storage

Additive spread:

```typescript
...(observatory !== undefined ? { observatory } : {})
```

Stored at `metadata.promptAssembly.observatory`.

---

## Consequences

### Positive

1. **Complete observability** — All six observability artifacts are now unified into a single `observatory` structure
2. **Backward compatible** — optional field, no breaking changes
3. **Metadata only** — no prompt injection, no behavioral changes
4. **Additive** — observatory coexists with all existing promptAssembly fields
5. **Tested** — 80+ tests covering BuilderOptions, builder invocation, metadata creation, metadata coexistence (15 field groups + all), determinism, statelessness, purity, legacy constructor, no prompt changes, compatibility, and observatory validation

### Negative

None.

### Risks

None.

---

## Compliance

- **TypeScript 0 errors** — verified
- **ESLint 0 errors** — verified
- **Existing tests all pass** — verified
- **80+ new tests pass** — in `PromptAssemblyObservatoryConsumption.test.ts`
- **observatory stored** at `metadata.promptAssembly.observatory`
- **No prompt changes** — metadata only
- **No API breaking changes** — all additions optional and backward compatible
- **Architecture version** v1.20 → v1.21