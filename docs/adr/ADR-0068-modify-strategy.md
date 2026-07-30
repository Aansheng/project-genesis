# ADR-0068: Modify Strategy

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-021  
**Architecture Version:** v0.56

---

## Context

WO-S5-019 introduced CreateStrategy and WO-S5-020 introduced QueryStrategy. The strategy layer now supports three strategies:

| Strategy | Name | Applies When |
|----------|------|-------------|
| CreateStrategy | `'create'` | SemanticContext contains `IntentType 'Create'` |
| QueryStrategy | `'query'` | SemanticContext contains `IntentType 'Query'` |
| DefaultPromptStrategy | `'default'` | Always (fallback) |

Modification-oriented requests (e.g., "移动树到左边", "修改房子颜色") currently fall through to `DefaultPromptStrategy`. Move and Modify are both transformation-oriented operations that logically group together.

### Problem

1. **No modification-specific strategy** — Move and Modify requests both resolve to `default`
2. **Missing keywords** — `RuleBasedIntentAnalyzer` lacks several Chinese and English modification keywords
3. **Move and Modify ungrouped** — Both are transformation operations but have no unified strategy

### Constraints

1. **No interface modifications** — All existing interfaces unchanged
2. **Additive only** — No deletions, no modifications to existing fields
3. **No breaking changes** — All existing tests pass
4. **CreateStrategy and QueryStrategy unaffected**
5. **DefaultPromptStrategy remains fallback**
6. **ModifyStrategy covers both Move and Modify intents** — future compatibility

---

## Decision

### ModifyStrategy

New class `ModifyStrategy` implementing `PromptStrategy`:

```typescript
class ModifyStrategy implements PromptStrategy {
  readonly name = 'modify'
  applies(context: SemanticContext): boolean {
    return context.intent?.intents.some(i => i.type === 'Move' || i.type === 'Modify') ?? false
  }
}
```

- **Name**: `'modify'`
- **Selection rule**: Returns `true` when `SemanticContext` contains `IntentType 'Move'` OR `IntentType 'Modify'`
- **Combined scope**: Move and Modify are both transformation-oriented — grouping them under one strategy simplifies the strategy layer while preserving future extensibility
- **Third business-specific strategy** — follows the same pattern as CreateStrategy and QueryStrategy

### Keyword Additions

Added 6 missing keywords to `RuleBasedIntentAnalyzer`:

| Language | Keywords Added | Intent Type |
|----------|---------------|-------------|
| Chinese | 调整, 替换, 更新 | `Modify` |
| English | modify, update, adjust | `Modify` |

All additions strictly additive — no existing keywords removed or modified.

### Selection Precedence

```
[CreateStrategy, QueryStrategy, ModifyStrategy, DefaultPromptStrategy]
  ↓ first-match wins

Create intent  → CreateStrategy  (name = 'create')
Query intent   → QueryStrategy   (name = 'query')
Move intent    → ModifyStrategy   (name = 'modify')
Modify intent  → ModifyStrategy   (name = 'modify')
Delete intent  → DefaultPromptStrategy (name = 'default')
```

### Rendering

When ModifyStrategy is selected, `DefaultPromptStrategyRenderer` renders:

```
Prompt Strategy:

- modify
```

---

## Consequences

### Positive

1. **Move and Modify requests identified** — both route to `modify` strategy
2. **Expanded keyword coverage** — 6 new keywords for better intent detection
3. **All four strategies coexist** — Create, Query, Modify, Default each handle their domain
4. **No breaking changes** — all existing behavior preserved
5. **Unified transformation strategy** — Move and Modify logically grouped

### Negative

None.

### Neutral

1. A future DeleteStrategy would follow the same pattern to complete the intent → strategy mapping
2. ModifyStrategy could be split into separate MoveStrategy and ModifyStrategy if needed

---

## Alternatives Considered

### Separate MoveStrategy and ModifyStrategy

Rejected — Move and Modify are both transformation operations. A single ModifyStrategy simplifies the strategy layer while still providing distinct routing from Create, Query, and Default. If needed, they can be split later.

### ModifyStrategy only handling Modify intent

Rejected — Move operations are semantically transformation-oriented (changing position is a form of modification). Grouping them provides better user experience and simpler strategy precedence.

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All 2314 pass (zero modifications to existing test files)
- **New tests**: `ModifyStrategy.test.ts` with 97 comprehensive test cases
- **CreateStrategy**: All 83 tests still pass — unaffected
- **QueryStrategy**: All 89 tests still pass — unaffected

---

## References

- WO-S5-019 — Create Strategy (ADR-0066)
- WO-S5-020 — Query Strategy (ADR-0067)
- `packages/ai/src/strategy/ModifyStrategy.ts`
- `packages/ai/src/intent/RuleBasedIntentAnalyzer.ts`
