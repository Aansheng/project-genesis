# ADR-0069: Delete Strategy

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-022  
**Architecture Version:** v0.57

---

## Context

WO-S5-019 through WO-S5-021 introduced CreateStrategy, QueryStrategy, and ModifyStrategy. Four of five IntentTypes now have dedicated strategies:

| Strategy | Name | Applies When |
|----------|------|-------------|
| CreateStrategy | `'create'` | `IntentType 'Create'` |
| QueryStrategy | `'query'` | `IntentType 'Query'` |
| ModifyStrategy | `'modify'` | `IntentType 'Move'` or `'Modify'` |
| DefaultPromptStrategy | `'default'` | Always (fallback) |

Delete requests (e.g., "删除树", "destroy the house") still fall through to `DefaultPromptStrategy`.

### Problem

1. **No delete-specific strategy** — Delete is the only IntentType without a dedicated strategy
2. **Missing keywords** — `RuleBasedIntentAnalyzer` lacks several Chinese and English delete keywords
3. **Incomplete intent coverage** — Four of five intent types are routed; Delete is the gap

---

## Decision

### DeleteStrategy

New class `DeleteStrategy` implementing `PromptStrategy`:

```typescript
class DeleteStrategy implements PromptStrategy {
  readonly name = 'delete'
  applies(context: SemanticContext): boolean {
    return context.intent?.intents.some(i => i.type === 'Delete') ?? false
  }
}
```

- **Name**: `'delete'`
- **Selection rule**: Returns `true` when `SemanticContext` contains `IntentType 'Delete'`
- **Fourth business-specific strategy** — completes the intent → strategy mapping

### Keyword Additions

Added 6 missing keywords to `RuleBasedIntentAnalyzer` for `IntentType 'Delete'`:

| Language | Keywords Added | Existing Keywords |
|----------|---------------|-------------------|
| Chinese | 销毁, 干掉, 消灭 | 删除, 移除, 清除 |
| English | destroy, clear, erase | delete, remove |

All additions strictly additive.

### Complete Strategy Routing

All five IntentTypes now have dedicated strategies:

```
[CreateStrategy, QueryStrategy, ModifyStrategy, DeleteStrategy, DefaultPromptStrategy]

Create → create
Query  → query
Move   → modify
Modify → modify
Delete → delete
Other  → default (fallback — no intent matched)
```

---

## Consequences

### Positive

1. **Complete intent coverage** — all five IntentTypes route to dedicated strategies
2. **Delete requests identified** — "删除树", "destroy the house", etc. produce `delete` strategy
3. **Expanded keyword coverage** — 6 new delete keywords
4. **No breaking changes** — all existing behavior preserved
5. **DefaultPromptStrategy still fallback** — for any context without a matching intent

### Negative

None.

### Neutral

1. DefaultPromptStrategy is now only selected when SemanticContext has no recognized intent
2. All five intent types have 1:1 (or 2:1 for Move+Modify) strategy mapping

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All 2411 pass (zero modifications)
- **New tests**: `DeleteStrategy.test.ts` with 93 comprehensive test cases
- **CreateStrategy**: All 83 tests still pass
- **QueryStrategy**: All 89 tests still pass
- **ModifyStrategy**: All 97 tests still pass

---

## References

- WO-S5-019 — Create Strategy (ADR-0066)
- WO-S5-020 — Query Strategy (ADR-0067)
- WO-S5-021 — Modify Strategy (ADR-0068)
- `packages/ai/src/strategy/DeleteStrategy.ts`
- `packages/ai/src/intent/RuleBasedIntentAnalyzer.ts`
