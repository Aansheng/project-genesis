# ADR-0136: Prompt Assembly Observatory Diff Consumption

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-089  
**Architecture Version:** v1.22 → v1.23

---

## Context

PromptAssemblyObservatoryDiffer was introduced as a foundation in WO-S5-088, providing the interface and default implementation for comparing two PromptAssemblyObservatory instances. Following the established consumption pattern used by historyDiff, timelineDiff, and traceDiff, the observatory differ now needs to be wired into DefaultPromptBuilder.

### Problem

1. **Not wired** — PromptAssemblyObservatoryDiffer is not consumed by the builder
2. **No BuilderOptions entry** — no way to pass the differ to DefaultPromptBuilder
3. **No phase** — no build phase invokes the differ
4. **No metadata output** — observatory diff is not stored in `metadata.promptAssembly`

---

## Decision

### BuilderOptions Extension

A new optional field in `packages/ai/src/prompt/BuilderOptions.ts`:

```typescript
promptAssemblyObservatoryDiffer?: PromptAssemblyObservatoryDiffer
```

Backward compatible — all existing fields unchanged.

### DefaultPromptBuilder Extension

**New imports:**
- `PromptAssemblyObservatoryDiffer` (type)
- `PromptAssemblyObservatoryDiff` (type)

**New private field:**
```typescript
private readonly promptAssemblyObservatoryDiffer?:
  PromptAssemblyObservatoryDiffer
```

**BuilderOptions path:** wired from `opts.promptAssemblyObservatoryDiffer`
**Legacy path:** set to `undefined`

### Phase 0.9599775

Inserted between Phase 0.959977 (ObservatoryBuilder) and Phase 0.96:

```text
Phase 0.959977  →  ObservatoryBuilder
Phase 0.9599775 →  ObservatoryDiffer
Phase 0.96      →  PromptAssemblyStrategyResolver
```

**Implementation:**

```typescript
let observatoryDiff: PromptAssemblyObservatoryDiff | undefined
if (
  observatory !== undefined &&
  this.promptAssemblyObservatoryDiffer !== undefined
) {
  observatoryDiff = this.promptAssemblyObservatoryDiffer.diff(
    {} as PromptAssemblyObservatory,
    observatory,
  )
}
```

Diff baseline follows the same pattern as `historyDiff`, `timelineDiff`, and `traceDiff` — empty object as baseline.

### Metadata

Stored at `metadata.promptAssembly.observatoryDiff`:

```typescript
...(observatoryDiff !== undefined ? { observatoryDiff } : {})
```

Additive — coexists with all existing fields.

### No Modifications

- PromptRenderer, PromptCompression, Planner, Runtime, AgentLoop, Pipeline, PromptAssemblyObservatory, PromptAssemblyObservatoryBuilder, PromptAssemblyObservatoryDiffer, DefaultPromptAssemblyObservatoryDiffer

### No Prompt Changes

- Metadata only — no prompt injection, no behavior changes

---

## Consequences

### Positive

1. **Observatory differ wired** — PromptAssemblyObservatoryDiffer is consumed by DefaultPromptBuilder
2. **Phase order maintained** — Phase 0.9599775 fits cleanly between observatory builder and strategy resolver
3. **Consistent with other diffs** — follows same pattern as historyDiff, timelineDiff, and traceDiff
4. **Backward compatible** — no breaking changes to any public API
5. **Tested** — 80+ tests covering BuilderOptions, differ invocation, metadata creation, coexistence, determinism, statelessness, purity, legacy constructor, no prompt changes, compatibility, and diff validation

### Negative

None.

### Risks

None.

---

## Compliance

- **TypeScript 0 errors** — verified
- **ESLint 0 errors** — verified
- **Existing tests all pass** — verified
- **80+ new tests pass** — in `PromptAssemblyObservatoryDiffConsumption.test.ts`
- **No PromptBuilder interface changes**
- **No BuilderOptions interface changes** (new optional field only)
- **No metadata changes** beyond new observatoryDiff field
- **No prompt changes** — metadata only
- **No API breaking changes**
- **Architecture version** v1.22 → v1.23