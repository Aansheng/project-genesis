# ADR-0084: Delete Prompt Assembly Strategy

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-037  
**Architecture Version:** v0.72

---

## Context

WO-S5-031 through WO-S5-036 introduced `PromptAssemblyStrategy` foundation plus three business-specific strategies: Create, Query, and Modify. The resolver currently routes `'create'`, `'query'`, and `'modify'` to their dedicated strategies. Delete workflows fall back to `DefaultPromptAssemblyStrategy` (identity).

### Problem

1. **No delete-specific assembly** — `DeleteStrategy` has no corresponding `DeletePromptAssemblyStrategy`
2. **Entity and observation context not prioritized** — delete tasks need to identify what to remove
3. **Delete workflows lack differentiation** — no reordering optimized for removal-oriented requests

---

## Decision

### DeletePromptAssemblyStrategy

Introduce the fourth business-specific `PromptAssemblyStrategy` implementation for delete requests:

```typescript
class DeletePromptAssemblyStrategy implements PromptAssemblyStrategy {
  readonly strategyName = 'delete'
}
```

**Reordering priority for delete:**
1. `userInput`
2. `worldState`
3. `entityRendered`
4. `observations`
5. `memory`
6. `strategyModuleRendered`
7. `strategyRendered`

This prioritizes observations and entity context to help identify what to remove.

### Resolver Update

Update `DefaultPromptAssemblyStrategyResolver` to route `'delete'`:

```
'create' → CreatePromptAssemblyStrategy
'query'  → QueryPromptAssemblyStrategy
'modify' → ModifyPromptAssemblyStrategy
'delete' → DeletePromptAssemblyStrategy
everything else → DefaultPromptAssemblyStrategy
```

### Existing Behavior Unchanged

All existing strategies and routing unchanged.

---

## Consequences

### Positive

1. **Complete business strategy coverage** — all four IntentTypes now have dedicated assembly strategies
2. **Delete-specific optimization** — observations prioritized higher than in other strategies
3. **Backward compatible** — all existing tests pass

### Negative

None.

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All pass (zero behavioral modifications)
- **New tests**: `DeletePromptAssemblyStrategy.test.ts` with comprehensive coverage
- **No breaking changes** to any Public API

---

## References

- `packages/ai/src/strategy/DeletePromptAssemblyStrategy.ts`
- `packages/ai/src/strategy/DefaultPromptAssemblyStrategyResolver.ts`
- `packages/ai/src/__tests__/DeletePromptAssemblyStrategy.test.ts`