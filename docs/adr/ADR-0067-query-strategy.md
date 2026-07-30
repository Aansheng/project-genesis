# ADR-0067: Query Strategy

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-020  
**Architecture Version:** v0.55

---

## Context

WO-S5-019 introduced `CreateStrategy` as the first business-specific `PromptStrategy`. When a creation request is detected, `DefaultPromptStrategySelector` selects `CreateStrategy` (name = `'create'`) instead of `DefaultPromptStrategy`.

Query-oriented requests (e.g., "列出所有树", "how many trees") are another primary use case. Without a query-specific strategy, these requests fall through to `DefaultPromptStrategy`, which provides no query-specific prompt assembly guidance.

### Current Strategy Landscape

| Strategy | Name | Applies When |
|----------|------|-------------|
| CreateStrategy | `'create'` | SemanticContext contains `IntentType 'Create'` |
| DefaultPromptStrategy | `'default'` | Always (fallback) |

### Problem

1. **No query-specific strategy** — Query requests like "列出所有树" and "how many trees" both resolve to `default` strategy
2. **Missing Query keywords** — `RuleBasedIntentAnalyzer` lacks several common Chinese and English query keywords
3. **Strategy layer underutilized** — Only CreateStrategy exists as a business-specific strategy

### Constraints

1. **No interface modifications** — `PromptStrategy`, `PromptStrategySelector`, `PromptStrategyRenderer`, `Pipeline`, `Planner`, `Runtime`, `Provider`, `Memory`, `AgentLoop`, `BuilderOptions` — all unchanged
2. **Additive only** — New class, new exports, new keywords — no deletions, no modifications to existing fields
3. **No breaking changes** — All existing tests pass with zero modifications
4. **No Sprint 4 frozen interface modifications**
5. **QueryStrategy selected before DefaultPromptStrategy** — first-match wins in `DefaultPromptStrategySelector`
6. **CreateStrategy unaffected** — CreateStrategy still wins for Create requests
7. **DefaultPromptStrategy remains fallback** — when no strategy matches, default still applies

---

## Decision

### QueryStrategy

New class `QueryStrategy` implementing `PromptStrategy`:

```typescript
class QueryStrategy implements PromptStrategy {
  readonly name = 'query'
  applies(context: SemanticContext): boolean {
    return context.intent?.intents.some(i => i.type === 'Query') ?? false
  }
}
```

- **Name**: `'query'`
- **Selection rule**: Returns `true` when `SemanticContext` contains an intent with `type === 'Query'`
- **Rule-based V1**: Leverages existing intent analysis pipeline rather than re-parsing raw text
- **Second business-specific strategy** — follows the same pattern as CreateStrategy

### Keyword Additions

Added 11 missing keywords to `RuleBasedIntentAnalyzer` for `IntentType 'Query'`:

| Language | Keywords Added | Existing Keywords |
|----------|---------------|-------------------|
| Chinese | 查看, 显示, 列出, 获取, 多少, 哪些 | 查询, 看看, 有什么 |
| English | query, get, find, which, how many | what, show, list |

All additions are strictly additive — no existing keywords removed or modified.

### Selection Flow

```
Input: "列出所有树"
  → RuleBasedIntentAnalyzer.analyze() → IntentResult { intents: [{ type: 'Query' }] }
  → SemanticContextBuilder.build() → SemanticContext { intent: { intents: [{ type: 'Query' }] } }
  → DefaultPromptStrategySelector.select([CreateStrategy, QueryStrategy, DefaultPromptStrategy], context)
  → CreateStrategy.applies(context) → false (not Create intent)
  → QueryStrategy.applies(context) → true (Query intent)
  → Selected: QueryStrategy (name = 'query')

Input: "创建一棵树"
  → RuleBasedIntentAnalyzer.analyze() → IntentResult { intents: [{ type: 'Create' }] }
  → SemanticContextBuilder.build() → SemanticContext { intent: { intents: [{ type: 'Create' }] } }
  → DefaultPromptStrategySelector.select([CreateStrategy, QueryStrategy, DefaultPromptStrategy], context)
  → CreateStrategy.applies(context) → true (Create intent)
  → Selected: CreateStrategy (name = 'create') — first-match wins
```

### Rendering

When QueryStrategy is selected, `DefaultPromptStrategyRenderer` renders:

```
Prompt Strategy:

- query
```

### Strategy Coexistence

| Input | Intent | Selected Strategy |
|-------|--------|-------------------|
| 创建一棵树 | Create | CreateStrategy |
| 列出所有树 | Query | QueryStrategy |
| 移动树 | Move | DefaultPromptStrategy |

---

## Consequences

### Positive

1. **Query requests identified** — "列出所有树", "how many trees", etc. now produce `query` strategy
2. **Expanded keyword coverage** — 11 new Query keywords for better intent detection
3. **Strategy coexistence verified** — CreateStrategy still wins for Create requests
4. **No breaking changes** — All existing code works unchanged
5. **Default remains fallback** — Non-create, non-query requests still get `DefaultPromptStrategy`

### Negative

None.

### Neutral

1. Future strategies (DeleteStrategy, MoveStrategy, ModifyStrategy) will follow the same pattern
2. Strategy ordering matters — CreateStrategy must be checked before QueryStrategy in the strategies array when the same context might contain both intents

---

## Alternatives Considered

### Combined strategy for all intent types

Rejected — Single-strategy approach loses the granularity of distinct strategy names. Separate strategies allow different rendering and future per-strategy behavior.

### QueryStrategy also matching Create intent

Rejected — Each strategy should have a single responsibility. CreateStrategy handles Create, QueryStrategy handles Query. First-match wins handles the case where both intents exist.

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All 2225 pass (zero modifications to existing test files)
- **New tests**: `QueryStrategy.test.ts` with 89 comprehensive test cases
- **RuleBasedIntentAnalyzer**: All tests pass (11 new keywords added additively)
- **CreateStrategy**: All 83 tests still pass — unaffected

---

## References

- WO-S5-019 — Create Strategy
- ADR-0066 — Create Strategy
- ADR-0062 — Prompt Strategy Foundation
- `packages/ai/src/strategy/QueryStrategy.ts`
- `packages/ai/src/strategy/CreateStrategy.ts`
- `packages/ai/src/intent/RuleBasedIntentAnalyzer.ts`
