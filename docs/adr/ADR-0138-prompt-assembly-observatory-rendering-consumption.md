# ADR-0138: Prompt Assembly Observatory Renderer Consumption

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-091  
**Architecture Version:** v1.24 → v1.25

---

## Context

`PromptAssemblyObservatoryRenderer` (WO-S5-090, ADR-0137) provides human-readable rendering for `PromptAssemblyObservatory`. However, this renderer is not yet consumed inside `DefaultPromptBuilder`.

The observatory itself is already built at Phase 0.959977 (WO-S5-087, ADR-0135) and stored at `metadata.promptAssembly.observatory`. The observatory diff is already computed at Phase 0.9599775 (WO-S5-089, ADR-0136).

### Problem

1. **No observatory rendering in metadata** — `observatoryRendered` is absent from build output
2. **No renderer wiring** — `PromptAssemblyObservatoryRenderer` not accepted or invoked by `DefaultPromptBuilder`
3. **No Phase 0.95997775** — no dedicated pipeline phase for observatory rendering

---

## Decision

### BuilderOptions Extension

Add optional `promptAssemblyObservatoryRenderer` field:

```typescript
import type { PromptAssemblyObservatoryRenderer }
  from '../strategy/PromptAssemblyObservatoryRenderer'

export interface BuilderOptions {
  // ... existing fields ...
  promptAssemblyObservatoryRenderer?: PromptAssemblyObservatoryRenderer
}
```

Backward compatible — all existing fields, constructors, and callers remain unchanged.

### DefaultPromptBuilder Changes

#### Private field

```typescript
private readonly promptAssemblyObservatoryRenderer?:
  PromptAssemblyObservatoryRenderer
```

#### Constructor wiring

BuilderOptions path:

```typescript
this.promptAssemblyObservatoryRenderer =
  opts.promptAssemblyObservatoryRenderer
```

Legacy path:

```typescript
this.promptAssemblyObservatoryRenderer = undefined
```

#### New Phase 0.95997775

Inserted between Phase 0.9599775 (ObservatoryDiffer) and Phase 0.96 (StrategyResolver):

```typescript
// Phase 0.95997775: PromptAssemblyObservatoryRenderer — render observatory as human-readable text
let observatoryRendered: string | undefined
if (
  observatory !== undefined &&
  this.promptAssemblyObservatoryRenderer !== undefined
) {
  const rendered =
    this.promptAssemblyObservatoryRenderer.render(
      observatory,
    )

  if (rendered.length > 0) {
    observatoryRendered = rendered
  }
}
```

#### Metadata storage

```typescript
...(observatoryRendered !== undefined
  ? { observatoryRendered }
  : {}),
```

Added alongside existing `observatory` and `observatoryDiff` fields in the `promptAssembly` metadata block. Uses additive spread pattern — never overwrites existing fields.

### No Consumer Changes

This work item is **consumption only**. No modifications to:
- `PromptAssemblyObservatory`
- `PromptAssemblyObservatoryBuilder`
- `PromptAssemblyObservatoryDiff`
- `PromptAssemblyObservatoryDiffer`
- `PromptAssemblyObservatoryRenderer`
- `DefaultPromptAssemblyObservatoryRenderer`
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

1. **Observatory rendering in metadata** — `observatoryRendered` available at `metadata.promptAssembly.observatoryRendered`
2. **Phase 0.95997775** — dedicated phase for observatory rendering
3. **Backward compatible** — no breaking changes to BuilderOptions or constructor
4. **Metadata only** — no prompt injection, no behavior changes
5. **Additive** — coexists with all existing metadata fields without overwriting
6. **Tested** — ~80 tests covering BuilderOptions, renderer invocation, metadata creation, coexistence, determinism, statelessness, purity, legacy constructor, no prompt changes, compatibility, and observatory rendering validation

### Negative

None.

### Risks

None.

---

## Compliance

- **TypeScript 0 errors** — verified
- **ESLint 0 errors** — verified
- **Existing tests all pass** — verified
- **~80 new tests pass** — in `PromptAssemblyObservatoryRenderingConsumption.test.ts`
- **No prompt changes** — metadata only
- **No metadata overwrites** — additive only
- **No API breaking changes** — backward compatible
- **Architecture version** v1.24 → v1.25