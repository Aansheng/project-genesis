# ADR-0066: Create Strategy

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-019  
**Architecture Version:** v0.54

---

## Context

Sprint 5 Strategy Layer is complete with `PromptStrategy`, `PromptStrategySelector`, and `PromptStrategyRenderer` all operational. However, only one strategy exists: `DefaultPromptStrategy`, which always applies. No business-specific strategies exist.

Creation-oriented requests (e.g., "创建一棵树", "generate a house") are a primary use case. Without a specific strategy, all requests — including creation requests — fall through to `DefaultPromptStrategy`, which provides no creation-specific prompt assembly guidance.

### Problem

1. **No business-specific strategies** — Only `DefaultPromptStrategy` exists, which applies to every context
2. **Creation requests indistinguishable** — "创建一棵树" and "查询世界" both resolve to `default` strategy
3. **Strategy layer unused** — The strategy selection and rendering pipeline exists but has no concrete strategies to select between

### Constraints

1. **No interface modifications** — `PromptStrategy`, `PromptStrategySelector`, `PromptStrategyRenderer`, `Pipeline`, `Planner`, `Runtime`, `Provider`, `Memory`, `AgentLoop`, `BuilderOptions` — all unchanged
2. **Additive only** — New class, new exports — no deletions, no modifications to existing fields
3. **No breaking changes** — All existing tests pass with zero modifications
4. **No Sprint 4 frozen interface modifications**
5. **CreateStrategy selected before DefaultPromptStrategy** — first-match wins in `DefaultPromptStrategySelector`
6. **DefaultPromptStrategy remains fallback** — when no strategy matches, default still applies

---

## Decision

### CreateStrategy

New class `CreateStrategy` implementing `PromptStrategy`:

```typescript
class CreateStrategy implements PromptStrategy {
  readonly name = 'create'
  applies(context: SemanticContext): boolean {
    return context.intent?.intents.some(i => i.type === 'Create') ?? false
  }
}
```

- **Name**: `'create'`
- **Selection rule**: Returns `true` when `SemanticContext` contains an intent with `type === 'Create'`
- **Rule-based V1**: Leverages existing intent analysis pipeline (IntentAnalyzer → SemanticContext) rather than re-parsing raw text
- **First business-specific strategy**: Demonstrates the strategy selection pattern for future strategies

### Keyword Support

To ensure end-to-end keyword detection for creation requests, added 4 missing keywords to `RuleBasedIntentAnalyzer`:

| Language | Keywords Added | Mapped Intent |
|----------|---------------|---------------|
| Chinese | 新建, 制造 | `Create` |
| English | generate, build | `Create` |

These are strictly additive — no existing keywords removed or modified.

### Selection Flow

```
Input: "创建一棵树"
  → RuleBasedIntentAnalyzer.analyze() → IntentResult { intents: [{ type: 'Create' }] }
  → SemanticContextBuilder.build() → SemanticContext { intent: { intents: [{ type: 'Create' }] } }
  → DefaultPromptStrategySelector.select([CreateStrategy, DefaultPromptStrategy], context)
  → CreateStrategy.applies(context) → true
  → Selected: CreateStrategy (name = 'create')

Input: "查询世界"
  → RuleBasedIntentAnalyzer.analyze() → IntentResult { intents: [{ type: 'Query' }] }
  → SemanticContextBuilder.build() → SemanticContext { intent: { intents: [{ type: 'Query' }] } }
  → DefaultPromptStrategySelector.select([CreateStrategy, DefaultPromptStrategy], context)
  → CreateStrategy.applies(context) → false
  → DefaultPromptStrategy.applies(context) → true
  → Selected: DefaultPromptStrategy (name = 'default')
```

### Rendering

When CreateStrategy is selected, `DefaultPromptStrategyRenderer` renders:

```
Prompt Strategy:

- create
```

Instead of:

```
Prompt Strategy:

- default
```

---

## Consequences

### Positive

1. **First business-specific strategy** — Demonstrates the strategy pattern is functional beyond the default
2. **Creation requests identified** — "创建一棵树", "generate a house", etc. now produce `create` strategy
3. **Strategy selection verified** — Proves `DefaultPromptStrategySelector` first-match-wins works correctly
4. **Architecture-aligned** — CreateStrategy leverages existing intent pipeline rather than duplicating keyword logic
5. **No breaking changes** — All existing code works unchanged
6. **Default remains fallback** — Non-creation requests still get `DefaultPromptStrategy`

### Negative

None.

### Neutral

1. CreateStrategy depends on intent analysis being in the SemanticContext — if `IntentAnalyzer` is not injected into the pipeline, `SemanticContext.intent` is undefined, and CreateStrategy returns `false` (falls back to default)
2. Future strategies (DeleteStrategy, MoveStrategy, etc.) will follow the same pattern

---

## Alternatives Considered

### Keyword matching inside CreateStrategy

Rejected — CreateStrategy receives `SemanticContext`, not raw text. Doing keyword matching would require either changing the `PromptStrategy.applies()` signature or duplicating keyword logic already in `RuleBasedIntentAnalyzer`. The architecture-aligned approach is to leverage the existing intent analysis pipeline.

### Direct keyword matching (bypassing intent pipeline)

Rejected — Violates separation of concerns. The intent pipeline already handles keyword detection, segmentation, and deduplication. CreateStrategy should consume the analyzed result, not re-implement analysis.

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors (0 new warnings)
- **Existing tests**: All 2142 pass (zero modifications to existing test files)
- **New tests**: `CreateStrategy.test.ts` with 83 comprehensive test cases
- **RuleBasedIntentAnalyzer**: 93 tests pass (4 new keywords added additively)

---

## References

- WO-S5-015 — Prompt Strategy Foundation
- WO-S5-016 — Prompt Strategy Consumption
- WO-S5-017 — Prompt Strategy Rendering Foundation
- WO-S5-018 — Prompt Strategy Prompt Integration
- ADR-0062 — Prompt Strategy Foundation
- ADR-0063 — Prompt Strategy Consumption
- ADR-0064 — Prompt Strategy Rendering Foundation
- ADR-0065 — Prompt Strategy Prompt Integration
- `packages/ai/src/strategy/CreateStrategy.ts`
- `packages/ai/src/intent/RuleBasedIntentAnalyzer.ts`
