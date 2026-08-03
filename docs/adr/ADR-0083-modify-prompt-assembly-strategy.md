# ADR-0083: Modify Prompt Assembly Strategy

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-036  
**Architecture Version:** v0.71

---

## Context

WO-S5-033 through WO-S5-035 introduced `CreatePromptAssemblyStrategy` and `QueryPromptAssemblyStrategy`. The resolver currently routes `'create'` and `'query'` to their dedicated strategies. Modify and Move workflows fall back to `DefaultPromptAssemblyStrategy` (identity).

### Problem

1. **No modify-specific assembly** — `ModifyStrategy` has no corresponding `ModifyPromptAssemblyStrategy`
2. **Entity context not prioritized** — modify/move tasks need entity context early in the prompt
3. **Modify workflows lack differentiation** — no reordering optimized for change-oriented requests

---

## Decision

### ModifyPromptAssemblyStrategy

Introduce the third business-specific `PromptAssemblyStrategy` implementation for modify/move requests:

```typescript
class ModifyPromptAssemblyStrategy implements PromptAssemblyStrategy {
  readonly strategyName = 'modify'
}
```

**Reordering priority for modify:**
1. `userInput`
2. `worldState`
3. `entityRendered`
4. `memory`
5. `observations`
6. `strategyModuleRendered`
7. `strategyRendered`

This prioritizes entity context (`entityRendered`), world knowledge (`worldState`, `memory`, `observations`), and strategy guidance, since modify tasks need to understand what to change and where.

### Resolver Update

Update `DefaultPromptAssemblyStrategyResolver` to route `'modify'`:

```
'create' → CreatePromptAssemblyStrategy
'query'  → QueryPromptAssemblyStrategy
'modify' → ModifyPromptAssemblyStrategy
everything else → DefaultPromptAssemblyStrategy
```

### Existing Behavior Unchanged

- `CreatePromptAssemblyStrategy` — unchanged
- `QueryPromptAssemblyStrategy` — unchanged
- `DefaultPromptAssemblyStrategy` — unchanged
- All non-create, non-query, non-modify names resolve to default

---

## Consequences

### Positive

1. **Third business-specific strategy** — modify assembly joins create and query
2. **Entity-first ordering** — `entityRendered` prioritized for modify/move workflows
3. **Create and query preserved** — no behavioral changes to existing strategies
4. **Backward compatible** — all existing tests pass

### Negative

None.

### Neutral

1. Modify priority uniquely includes `entityRendered` (not in create or query)
2. Shared priorities: `userInput`, `worldState`, `observations`, `strategyModuleRendered`, `strategyRendered` appear in all three strategies
3. Case-sensitive: only lowercase `'modify'` routes correctly

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All pass (zero behavioral modifications)
- **New tests**: `ModifyPromptAssemblyStrategy.test.ts` with comprehensive coverage
- **No breaking changes** to any Public API

---

## References

- `packages/ai/src/strategy/ModifyPromptAssemblyStrategy.ts`
- `packages/ai/src/strategy/DefaultPromptAssemblyStrategyResolver.ts`
- `packages/ai/src/__tests__/ModifyPromptAssemblyStrategy.test.ts`