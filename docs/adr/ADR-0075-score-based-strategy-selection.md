# ADR-0075: Score Based Strategy Selection

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-028  
**Architecture Version:** v0.63

---

## Context

WO-S5-027 introduced the `StrategyEvaluator` interface and `DefaultStrategyEvaluator`, establishing a scoring infrastructure for strategies. However, `DefaultPromptStrategySelector` still uses first-match-wins selection — it iterates strategies and returns the first one where `applies()` returns true.

### Current Behavior

```
for each strategy:
  if strategy.applies(context):
    return strategy  // first match wins
return DefaultPromptStrategy  // fallback
```

### Problem

1. **No scoring consumption** — StrategyEvaluator exists but is not used by the selector
2. **Binary only** — first-match-wins doesn't support nuanced scoring
3. **No transparency** — selector doesn't collect candidates or expose evaluation results
4. **No AI readiness** — future AI-based evaluators need a selector that can compare scores

---

## Decision

### Highest Score Wins

Replace first-match-wins with highest-score-wins:

1. Evaluate ALL strategies using the injected `StrategyEvaluator`
2. Collect `StrategyCandidate` entries with scores
3. Select the candidate with the highest score
4. Ties broken by array order (first occurrence wins)
5. Fall back to `DefaultPromptStrategy` if all scores are 0

### Constructor

```typescript
constructor(
  private readonly evaluator: StrategyEvaluator =
    new DefaultStrategyEvaluator()
) {}
```

Accepts an optional `StrategyEvaluator` — defaults to `DefaultStrategyEvaluator`.

### Backward Compatibility

With `DefaultStrategyEvaluator`:
- `applies() = true` → score 100
- `applies() = false` → score 0
- First strategy with score > 0 wins (identical to first-match-wins)
- All scores 0 → `DefaultPromptStrategy` fallback (identical)

The refactored selector produces **exactly the same results** as the previous implementation.

### NOT Modified

- `PromptBuilder` — unchanged
- `Pipeline` — unchanged
- `Planner` — unchanged
- `Runtime` — unchanged
- `AgentLoop` — unchanged
- `PromptRenderer` — unchanged
- `PromptContext` — unchanged
- `PromptCompression` — unchanged
- Strategy interfaces — unchanged
- StrategyModule — unchanged
- StrategyRenderer — unchanged

---

## Consequences

### Positive

1. **Score-based selection** — enables future AI evaluators with nuanced scoring
2. **Full evaluation** — every strategy gets evaluated (not just until first match)
3. **Transparent** — candidate collection enables inspection and logging
4. **Pluggable** — custom StrategyEvaluator can be injected
5. **Backward compatible** — identical results with DefaultStrategyEvaluator
6. **All 2752 existing tests pass** — zero behavior changes

### Negative

None.

### Neutral

1. Every strategy is now evaluated (O(n) always, not early-exit) — this is acceptable since evaluation is cheap
2. The `StrategySelectionResult` type exists but is not yet returned by `select()` — a future WO may extend the selector to return it

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All 2752 pass (zero modifications)
- **New tests**: `ScoreBasedStrategySelection.test.ts` with 30 comprehensive test cases
- **Total tests**: 2782 passing
- **Backward compatibility**: Verified — same results as first-match-wins for all existing strategies

---

## References

- WO-S5-027 — Dynamic Strategy Selection Foundation (ADR-0074)
- WO-S5-016 — Prompt Strategy Consumption (ADR-0063)
- `packages/ai/src/strategy/DefaultPromptStrategySelector.ts`
