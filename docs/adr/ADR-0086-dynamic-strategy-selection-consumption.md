# ADR-0086: Dynamic Strategy Selection Consumption

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-039  
**Architecture Version:** v0.74

---

## Context

WO-S5-028 (Score Based Strategy Selection) introduced `StrategyEvaluator` as a scoring mechanism for strategy selection. WO-S5-029 (Strategy Selection Result Consumption) introduced `StrategySelectionMetadata` for capturing evaluation results.

However, in `DefaultPromptBuilder`, the `StrategyEvaluator` was only used for metadata generation (Phase 0.91), not for driving strategy selection. The actual selection was still performed by `PromptStrategySelector` independently (Phase 0.9), resulting in two separate evaluation cycles.

### Problem

1. **Dual evaluation** — strategies evaluated twice: once by the selector, once by the metadata generator
2. **Evaluator not authoritative** — the evaluator only produced metadata, not selection decisions
3. **Selector bypasses evaluator** — the selector used its own internal evaluator, ignoring the builder-level evaluator
4. **Inconsistent scoring** — if selector and builder used different evaluators, scores could diverge

---

## Decision

### Refactor Phase 0.9 in DefaultPromptBuilder

Promote `StrategyEvaluator` to the authoritative scoring mechanism. Merge Phase 0.9 (selector call) and Phase 0.91 (metadata generation) into a single evaluator-driven flow:

```typescript
// Phase 0.9: StrategyEvaluator-driven strategy selection
// Evaluate strategies → generate scores → select highest → produce metadata

if (strategyEvaluator && strategies) {
  // Evaluator-driven selection: score all strategies, pick highest
  const evaluatedCandidates = strategies.map(s => ({
    strategy: s,
    score: strategyEvaluator.evaluate(s, semanticContext),
  }))

  // Select highest-scoring strategy (tie-break by order — first wins)
  let bestCandidate = evaluatedCandidates[0]
  for (let i = 1; i < evaluatedCandidates.length; i++) {
    if (evaluatedCandidates[i].score > bestCandidate.score) {
      bestCandidate = evaluatedCandidates[i]
    }
  }

  selectedStrategy = bestCandidate.score > 0
    ? bestCandidate.strategy
    : new DefaultPromptStrategy()

  // Build metadata from evaluator output
  strategySelectionMetadata = {
    selected: selectedStrategy.name,
    candidates: evaluatedCandidates.map(c => ({
      strategy: c.strategy.name,
      score: c.score,
    })),
  }
} else if (strategySelector && strategies) {
  // Fallback: selector-driven (backward compat — no evaluator)
  selectedStrategy = strategySelector.select(strategies, semanticContext)
} else {
  selectedStrategy = new DefaultPromptStrategy()
}
```

### Architecture Flow

Before (v0.73):
```
PromptBuilder.build()
  └── Phase 0.9: StrategySelector.select() → selectedStrategy
  └── Phase 0.91: StrategyEvaluator.evaluate() → metadata (re-evaluation)
```

After (v0.74):
```
PromptBuilder.build()
  └── Phase 0.9:
       ├── StrategyEvaluator.evaluate() → scores
       ├── Select highest score
       └── Produce StrategySelectionMetadata
```

### Key Design Properties

1. **Single evaluation** — strategies evaluated exactly once per build
2. **Evaluator authoritative** — the builder-level evaluator drives selection decisions
3. **Selector bypassed** — when evaluator is present, selector is not called (backward compatible fallback exists)
4. **Deterministic tie-breaking** — first occurrence wins (array order), matching existing behavior
5. **Zero-score fallback** — all scores ≤ 0 → DefaultPromptStrategy (unchanged)
6. **No prompt output changes** — metadata only, prompt text identical

### BuilderOptions

No changes to `BuilderOptions` interface. The existing `strategyEvaluator?: StrategyEvaluator` field remains unchanged.

When `strategies` AND `strategyEvaluator` are provided:
- Evaluator drives scoring and selection
- `StrategySelectionMetadata` is produced

When `strategies` AND `strategySelector` are provided but NO `strategyEvaluator`:
- Selector drives selection (backward compatible)
- No `StrategySelectionMetadata` produced

When neither `strategyEvaluator` nor `strategySelector` is provided:
- `DefaultPromptStrategy` fallback (unchanged)

### NOT Modified

- `PromptContext` — unchanged
- `PromptRenderer` — unchanged
- `PromptCompression` — unchanged
- `PromptStrategySelector` interface — unchanged
- `StrategyEvaluator` interface — unchanged
- `StrategySelectionMetadata` — unchanged
- `BuilderOptions` — unchanged (no new fields, no removed fields)
- Prompt output — unchanged
- Runtime, Planner, AgentLoop — unchanged

---

## Consequences

### Positive

1. **Single evaluation** — strategies evaluated once, not twice
2. **Evaluator drives selection** — authoritative scoring mechanism
3. **Consistent metadata** — metadata always reflects the actual selection scores
4. **Full backward compatibility** — existing tests pass without modification
5. **No API changes** — all interfaces, fields, and constructors unchanged

### Negative

None.

### Neutral

1. When both `strategyEvaluator` and `strategySelector` are provided, the evaluator takes precedence and the selector is not called
2. Phase 0.91 is merged into Phase 0.9 — no separate metadata generation step

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All 3454 pass (zero modifications)
- **New tests**: `DynamicStrategySelectionConsumption.test.ts` with 44 test cases
- **Total tests**: 3498 passing
- **No breaking changes** to any Public API

---

## References

- WO-S5-028 — Score Based Strategy Selection (ADR-0075)
- WO-S5-029 — Strategy Selection Result Consumption (ADR-0076)
- WO-S5-030 — Weighted Strategy Evaluator (ADR-0077)
- `packages/ai/src/prompt/DefaultPromptBuilder.ts`
- `packages/ai/src/__tests__/DynamicStrategySelectionConsumption.test.ts`