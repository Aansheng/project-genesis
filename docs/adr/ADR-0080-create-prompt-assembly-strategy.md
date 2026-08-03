# ADR-0080: Create Prompt Assembly Strategy

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-033  
**Architecture Version:** v0.68

---

## Context

WO-S5-031 introduced the `PromptAssemblyStrategy` foundation with `DefaultPromptAssemblyStrategy` as the only implementation. WO-S5-032 consumed the resolver into `DefaultPromptBuilder` as metadata-only Phase 0.96.

The strategy layer has separate strategy classes (`CreateStrategy`, `QueryStrategy`, `ModifyStrategy`, `DeleteStrategy`) and strategy modules (`CreateStrategyModule`, etc.), but all share the same `DefaultPromptAssemblyStrategy` regardless of the resolved strategy intent.

### Problem

1. **No business-specific assembly strategy** — all strategies resolve to `DefaultPromptAssemblyStrategy`
2. **No create differentiation** — `CreateStrategy` has no corresponding `CreatePromptAssemblyStrategy`
3. **Resolver is uniform** — `DefaultPromptAssemblyStrategyResolver` always returns `DefaultPromptAssemblyStrategy` regardless of strategy name
4. **No extension point** — future work orders cannot add business-specific assembly logic without this first step

---

## Decision

### CreatePromptAssemblyStrategy

Introduce the first business-specific `PromptAssemblyStrategy` implementation:

```typescript
class CreatePromptAssemblyStrategy implements PromptAssemblyStrategy {
  readonly strategyName = 'create'

  apply(sections: readonly string[]): readonly string[] {
    return sections
  }
}
```

**Current behavior:** Identity function — returns sections unchanged.

**Future behavior:** Will be modified by future work orders to optimize assembly for create-oriented requests (e.g., reordering sections, filtering irrelevant context, augmenting with schema information).

### Resolver Update

Update `DefaultPromptAssemblyStrategyResolver` to route `'create'` to `CreatePromptAssemblyStrategy`:

```
'create'    → CreatePromptAssemblyStrategy
everything else → DefaultPromptAssemblyStrategy
```

### NOT Modified

- `PromptAssemblyStrategy` interface — unchanged
- `PromptAssemblyStrategyResolver` interface — unchanged
- `DefaultPromptAssemblyStrategy` — unchanged
- `DefaultPromptBuilder` — unchanged
- `PromptRenderer` — unchanged
- `PromptCompression` — unchanged
- `PromptContext` — unchanged
- `Pipeline` — unchanged
- `Planner` — unchanged
- Prompt sections — not altered, reordered, or filtered

---

## Consequences

### Positive

1. **First business-specific strategy** — `CreatePromptAssemblyStrategy` establishes the pattern for future assembly strategies
2. **Resolver now routes** — `'create'` resolves to the correct strategy
3. **No behavior change** — identity function ensures zero prompt output differences
4. **Extension point established** — future work orders can modify `apply()` without changing architecture
5. **Backward compatible** — no breaking changes to any Public API

### Negative

None.

### Neutral

1. `CreatePromptAssemblyStrategy.apply()` is identity — same as `DefaultPromptAssemblyStrategy`
2. The resolver uses a simple `switch` statement — may evolve to a registry pattern when more strategies are added
3. `Create` strategy name is case-sensitive — lowercase only

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All pass (zero modifications)
- **New tests**: `CreatePromptAssemblyStrategy.test.ts` with 50+ test cases
- **No breaking changes** to any Public API
- **No prompt behavior changes** — prompt output identical

---

## References

- WO-S5-031 — Prompt Assembly Strategy Foundation (ADR-0078)
- WO-S5-032 — Prompt Assembly Strategy Consumption (ADR-0079)
- `packages/ai/src/strategy/CreatePromptAssemblyStrategy.ts`
- `packages/ai/src/strategy/DefaultPromptAssemblyStrategyResolver.ts`
- `packages/ai/src/__tests__/CreatePromptAssemblyStrategy.test.ts`