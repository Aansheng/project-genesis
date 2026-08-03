# ADR-0081: Create Prompt Assembly Consumption

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-034  
**Architecture Version:** v0.69

---

## Context

WO-S5-033 introduced `CreatePromptAssemblyStrategy` as the first business-specific `PromptAssemblyStrategy`. However, the strategy's `apply()` method was an identity function and its result was ignored by the builder — only metadata was stored.

### Problem

1. **Strategy result unused** — `DefaultPromptBuilder` Phase 0.96 resolved the assembly strategy but never called `apply()`
2. **No section reordering** — `CreatePromptAssemblyStrategy` did not influence prompt section ordering
3. **All strategies produce identical output** — no differentiation between create and non-create assembly

---

## Decision

### CreatePromptAssemblyStrategy.apply()

Replace identity function with priority-based reordering:

**Priority order:**
1. `userInput`
2. `worldState`
3. `strategyModuleRendered`
4. `strategyRendered`

All remaining sections keep their original relative order. No sections are removed, filtered, or modified.

```typescript
apply(sections: readonly string[]): readonly string[] {
  const priority: string[] = []
  const remaining: string[] = []

  for (const section of sections) {
    if (this.PRIORITY_ORDER.includes(section)) {
      priority.push(section)
    } else {
      remaining.push(section)
    }
  }

  priority.sort(
    (a, b) => this.PRIORITY_ORDER.indexOf(a) - this.PRIORITY_ORDER.indexOf(b),
  )

  return [...priority, ...remaining]
}
```

### DefaultPromptBuilder Phase 0.96

Previously, Phase 0.96 only stored metadata:

```
assemblyStrategy resolved → { strategyName }
metadata stored
apply() result ignored
```

Now Phase 0.96 also applies the reordering:

1. Resolve assembly strategy (once — stored for reuse)
2. Store metadata (unchanged)
3. Collect section keys from `renderContext` using `CANONICAL_ORDER`
4. Pass through `assemblyStrategy.apply()` to reorder
5. Rebuild `renderContext` with reordered key insertion order
6. Non-canonical keys (not in `CANONICAL_ORDER`) appended at end

The resolver is called exactly once per build — the resolved strategy instance is reused for both metadata and reordering.

### Example

Before (`DefaultPromptAssemblyStrategy`):
```
[ intentRendered, entityRendered, semanticRendered, strategyRendered, system, userInput, memory, worldState, observations ]
```

After (`CreatePromptAssemblyStrategy`):
```
[ userInput, worldState, strategyRendered, intentRendered, entityRendered, semanticRendered, system, memory, observations ]
```

### NOT Modified

- `PromptAssemblyStrategy` interface — unchanged
- `PromptAssemblyStrategyResolver` interface — unchanged
- `DefaultPromptAssemblyStrategy` — unchanged
- `DefaultPromptAssemblyStrategyResolver` — unchanged (existing routing preserved)
- `PromptRenderer` — unchanged
- `PromptCompression` — unchanged
- `PromptContext` — unchanged
- `Pipeline` — unchanged
- `Planner` — unchanged
- `PromptStrategy` — unchanged
- `StrategyModule` — unchanged

---

## Consequences

### Positive

1. **First real assembly behavior** — `CreatePromptAssemblyStrategy` actively reorders sections
2. **Non-create strategies unchanged** — only `'create'` routing triggers reordering
3. **Backward compatible** — all existing tests pass, no breaking changes
4. **Deterministic + pure** — same input always produces same output, no side effects
5. **Resolver called once** — efficiency: one resolve, two uses (metadata + reordering)

### Negative

None.

### Neutral

1. Section identifiers passed to `apply()` are `PromptContext` key names, not rendered content
2. Reordering only affects canonical sections — non-canonical keys are appended at end
3. `DefaultPromptAssemblyStrategy` (identity) is still used for all non-create strategies

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All 3071 pass (zero modifications)
- **New tests**: `CreatePromptAssemblyConsumption.test.ts` with 67 comprehensive test cases
- **Updated tests**: `CreatePromptAssemblyStrategy.test.ts` (2 tests updated for new behavior)
- **Total tests**: 3138 passing
- **No breaking changes** to any Public API

---

## References

- WO-S5-033 — Create Prompt Assembly Strategy (ADR-0080)
- `packages/ai/src/strategy/CreatePromptAssemblyStrategy.ts`
- `packages/ai/src/prompt/DefaultPromptBuilder.ts`
- `packages/ai/src/__tests__/CreatePromptAssemblyConsumption.test.ts`
- `packages/ai/src/__tests__/CreatePromptAssemblyStrategy.test.ts`