# ADR-0078: Prompt Assembly Strategy Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-031  
**Architecture Version:** v0.66

---

## Context

The strategy layer has evolved through WO-S5-015 through WO-S5-030:

- PromptStrategy + PromptStrategySelector + PromptStrategyRenderer
- StrategyModule + StrategyModuleRenderer
- StrategyEvaluator + DefaultStrategyEvaluator + WeightedStrategyEvaluator
- StrategySelectionMetadata
- Score-based strategy selection (highest-score-wins)

However, all strategies currently produce the same prompt structure. There is no abstraction for how different strategies influence the assembly of prompt sections into the final prompt.

### Problem

1. **No assembly abstraction** — strategies cannot influence how sections are ordered, filtered, or composed
2. **No resolution layer** — no mechanism to look up the correct assembly strategy by name
3. **Strategy-Based Prompt Assembly was deferred** — WO-S5-016 marked this as "Deferred" in AI_ARCHITECTURE.md

This work order introduces the architectural foundation (interfaces + default implementations) without modifying any existing behavior.

---

## Decision

### PromptAssemblyStrategy

Introduce an interface that allows different strategies to influence prompt assembly:

```typescript
interface PromptAssemblyStrategy {
  readonly strategyName: string
  apply(sections: readonly string[]): readonly string[]
}
```

- `strategyName` — identifies which strategy this assembly strategy belongs to
- `apply()` — receives ordered prompt section strings, returns assembled sections
- Future strategies may reorder, filter, augment, or transform sections

### DefaultPromptAssemblyStrategy

Default implementation: **identity function** — returns sections unchanged.

```typescript
class DefaultPromptAssemblyStrategy implements PromptAssemblyStrategy {
  readonly strategyName = 'default'
  apply(sections: readonly string[]): readonly string[] {
    return sections
  }
}
```

This preserves current behavior: all strategies produce the same prompt structure.

### PromptAssemblyStrategyResolver

Introduce a resolver interface that decouples consumers from concrete implementations:

```typescript
interface PromptAssemblyStrategyResolver {
  resolve(strategyName: string): PromptAssemblyStrategy
}
```

### DefaultPromptAssemblyStrategyResolver

Default implementation: always returns `DefaultPromptAssemblyStrategy`.

```typescript
class DefaultPromptAssemblyStrategyResolver implements PromptAssemblyStrategyResolver {
  resolve(_strategyName: string): PromptAssemblyStrategy {
    return new DefaultPromptAssemblyStrategy()
  }
}
```

### NOT Modified

- `PromptBuilder` — unchanged
- `PromptRenderer` — unchanged
- `PromptContext` — unchanged
- `PromptCompression` — unchanged
- `Pipeline` — unchanged
- `Planner` — unchanged

---

## Consequences

### Positive

1. **Assembly abstraction** — strategies can now influence prompt section assembly
2. **Resolution layer** — consumers can look up assembly strategies by name without knowing concrete classes
3. **Extensible** — future work orders can add custom PromptAssemblyStrategy implementations
4. **Backward compatible** — default implementations preserve current identity behavior
5. **Foundation only** — no behavior changes, no PromptBuilder modifications
6. **All existing tests pass** — zero breaking changes

### Negative

None.

### Neutral

1. The resolver always returns DefaultPromptAssemblyStrategy — future resolvers may route by strategy name
2. The `apply()` method uses `readonly string[]` for sections — this is the simplest abstraction for section manipulation
3. This is foundation only — not consumed by PromptBuilder yet

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All pass (zero modifications)
- **New tests**: `PromptAssemblyStrategyFoundation.test.ts` with 50+ comprehensive test cases
- **No breaking changes** to any Public API

---

## References

- WO-S5-027 — Dynamic Strategy Selection Foundation (ADR-0074)
- WO-S5-028 — Score Based Strategy Selection (ADR-0075)
- WO-S5-029 — Strategy Selection Result Consumption (ADR-0076)
- WO-S5-030 — Weighted Strategy Evaluator (ADR-0077)
- `packages/ai/src/strategy/PromptAssemblyStrategy.ts`
- `packages/ai/src/strategy/DefaultPromptAssemblyStrategy.ts`
- `packages/ai/src/strategy/PromptAssemblyStrategyResolver.ts`
- `packages/ai/src/strategy/DefaultPromptAssemblyStrategyResolver.ts`
