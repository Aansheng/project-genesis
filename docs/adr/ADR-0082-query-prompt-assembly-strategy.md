# ADR-0082: Query Prompt Assembly Strategy

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-035  
**Architecture Version:** v0.70

---

## Context

WO-S5-033 introduced `CreatePromptAssemblyStrategy` and WO-S5-034 made it actively reorder sections. The resolver now routes `'create'` to `CreatePromptAssemblyStrategy` via `DefaultPromptAssemblyStrategyResolver`.

There is no corresponding strategy for query/information-retrieval requests.

### Problem

1. **No query-specific assembly** — QueryStrategy has no corresponding `QueryPromptAssemblyStrategy`
2. **Create-only routing** — resolver only differentiates `'create'` from everything else
3. **Query prompts lack prioritization** — query tasks should prioritize world knowledge (worldState, memory, observations) over strategy guidance

---

## Decision

### QueryPromptAssemblyStrategy

Introduce the second business-specific `PromptAssemblyStrategy` implementation for query requests:

```typescript
class QueryPromptAssemblyStrategy implements PromptAssemblyStrategy {
  readonly strategyName = 'query'
}
```

**Reordering priority for query:**
1. `userInput`
2. `worldState`
3. `memory`
4. `observations`
5. `strategyModuleRendered`
6. `strategyRendered`

This prioritizes world knowledge and conversation history for information retrieval tasks, moving strategy guidance to lower priority.

### Resolver Update

Update `DefaultPromptAssemblyStrategyResolver` to route `'query'`:

```
'create' → CreatePromptAssemblyStrategy
'query'  → QueryPromptAssemblyStrategy
everything else → DefaultPromptAssemblyStrategy
```

### Existing Behavior Unchanged

- `CreatePromptAssemblyStrategy` — unchanged reordering priority
- `DefaultPromptAssemblyStrategy` — unchanged identity
- All non-create, non-query names resolve to default

---

## Consequences

### Positive

1. **Second business-specific strategy** — query assembly joins create assembly in the resolver
2. **Knowledge-first ordering** — query prompts prioritize worldState, memory, and observations
3. **Create behavior preserved** — no changes to create strategy or routing
4. **Backward compatible** — all existing tests pass

### Negative

None.

### Neutral

1. Query priority includes `memory` and `observations` — these are not in create's priority
2. Both create and query share `userInput`, `worldState`, `strategyModuleRendered`, `strategyRendered`
3. Case-sensitive: only lowercase `'query'` routes correctly

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All pass (zero modifications)
- **New tests**: `QueryPromptAssemblyStrategy.test.ts` with comprehensive coverage
- **No breaking changes** to any Public API

---

## References

- WO-S5-033 — Create Prompt Assembly Strategy (ADR-0080)
- WO-S5-034 — Create Prompt Assembly Consumption (ADR-0081)
- `packages/ai/src/strategy/QueryPromptAssemblyStrategy.ts`
- `packages/ai/src/strategy/DefaultPromptAssemblyStrategyResolver.ts`
- `packages/ai/src/__tests__/QueryPromptAssemblyStrategy.test.ts`