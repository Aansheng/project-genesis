# ADR-0077: Weighted Strategy Evaluator

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-030  
**Architecture Version:** v0.65

---

## Context

WO-S5-027 introduced `StrategyEvaluator` and `DefaultStrategyEvaluator`. WO-S5-028 upgraded `DefaultPromptStrategySelector` to highest-score-wins. WO-S5-029 consumed strategy selection results into metadata.

The current `DefaultStrategyEvaluator` produces binary scores:
- `applies() = true` → score 100
- `applies() = false` → score 0

### Problem

1. **No continuous scoring** — binary 100/0 doesn't capture partial relevance
2. **No cross-strategy weighting** — a Create strategy is somewhat relevant for Query intent, but binary scoring can't express this
3. **No Multi Strategy Routing readiness** — future routing decisions need nuanced scores, not just winner/loser

---

## Decision

### WeightedStrategyEvaluator

Introduce a `StrategyEvaluator` implementation that produces continuous, weighted scores based on intent-strategy relevance:

| Intent  | Create | Query | Modify | Delete |
|---------|--------|-------|--------|--------|
| Create  | 100    | 20    | 10     | 0      |
| Query   | 20     | 100   | 10     | 0      |
| Modify  | 10     | 10    | 100    | 20     |
| Move    | 10     | 10    | 100    | 20     |
| Delete  | 0      | 0     | 20     | 100    |
| Unknown | 0      | 0     | 0      | 0      |

### Design

```typescript
class WeightedStrategyEvaluator implements StrategyEvaluator {
  evaluate(strategy: PromptStrategy, context: SemanticContext): number {
    const intent = this.resolveIntent(context)
    return this.lookupScore(intent, strategy.name)
  }
}
```

- Resolves the first intent type from `SemanticContext.intent.intents[0].type`
- Looks up score from a static score table
- Unknown intent types → all scores 0
- Move intent maps to Modify scores (same semantic category)

### Score Table

The score table is a static `Record<string, Record<string, number>>`:
- Key 1: IntentType string
- Key 2: Strategy name
- Value: numeric score (0–100)

This is V1 — for architecture validation only. Future versions may use AI-based scoring.

### NOT Modified

- `PromptBuilder` — unchanged
- `Pipeline` — unchanged
- `Planner` — unchanged
- `Runtime` — unchanged
- `AgentLoop` — unchanged
- `PromptRenderer` — unchanged
- `PromptContext` — unchanged
- `PromptCompression` — unchanged

---

## Consequences

### Positive

1. **Continuous scoring** — strategies get weighted scores, not just 100/0
2. **Cross-strategy weighting** — Create scores 20 for Query intent (not 0)
3. **Multi Strategy Routing readiness** — downstream can use nuanced scores for dynamic decisions
4. **Pluggable** — can be injected into `DefaultPromptStrategySelector` or `BuilderOptions`
5. **Backward compatible** — existing DefaultStrategyEvaluator unchanged
6. **All 2818 existing tests pass** — zero behavior changes

### Negative

None.

### Neutral

1. The score table is hardcoded — future evaluators may use learned weights or AI-based scoring
2. Unknown strategies (not in the table) get score 0 — this is safe but means the table must be extended when new strategies are added
3. Move intent maps to Modify scores — this is a V1 simplification that may be refined later

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All 2818 pass (zero modifications)
- **New tests**: `WeightedStrategyEvaluator.test.ts` with 26 comprehensive test cases
- **Total tests**: 2844 passing
- **No breaking changes** to any Public API

---

## References

- WO-S5-027 — Dynamic Strategy Selection Foundation (ADR-0074)
- WO-S5-028 — Score Based Strategy Selection (ADR-0075)
- WO-S5-029 — Strategy Selection Result Consumption (ADR-0076)
- `packages/ai/src/strategy/WeightedStrategyEvaluator.ts`
