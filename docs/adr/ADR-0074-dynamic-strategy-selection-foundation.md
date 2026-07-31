# ADR-0074: Dynamic Strategy Selection Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-027  
**Architecture Version:** v0.62

---

## Context

The current strategy selection is purely rule-based: `DefaultPromptStrategySelector` iterates strategies and returns the first one where `applies()` returns true. This binary approach works but lacks nuance:

1. **Binary only** — `applies()` returns true/false, no confidence scoring
2. **No ranking** — first-match wins, no comparison of candidates
3. **No transparency** — selection result doesn't expose why a strategy was chosen
4. **No AI readiness** — future AI-based routing needs a scoring mechanism

### Problem

There is no infrastructure for:
- Scoring strategies by how well they match a context
- Collecting multiple candidates with their scores
- Producing a structured selection result for downstream inspection
- Plugging in AI-based evaluators that produce probabilistic scores

---

## Decision

### StrategyCandidate

```typescript
export interface StrategyCandidate {
  readonly strategy: PromptStrategy
  readonly score: number
}
```

Pairs a strategy with a numeric score (0–100 convention). Enables ranking and comparison.

### StrategySelectionResult

```typescript
export interface StrategySelectionResult {
  readonly selected: PromptStrategy
  readonly candidates: readonly StrategyCandidate[]
}
```

Contains the winning strategy and all evaluated candidates. Enables transparency and downstream inspection.

### StrategyEvaluator Interface

```typescript
export interface StrategyEvaluator {
  evaluate(strategy: PromptStrategy, context: SemanticContext): number
}
```

Produces a numeric score for a strategy given a semantic context. Pluggable — custom evaluators can use embeddings, LLM calls, or learned models.

### DefaultStrategyEvaluator

Default implementation that preserves existing behavior:

| Condition | Score |
|-----------|-------|
| `applies() === true` | 100 |
| `applies() === false` | 0 |

This is exactly equivalent to the current binary selection — no behavior change.

### NOT Modified

- `PromptBuilder` — unchanged
- `Pipeline` — unchanged
- `Planner` — unchanged
- `Runtime` — unchanged
- `AgentLoop` — unchanged
- `PromptRenderer` — unchanged
- `PromptContext` — unchanged
- `PromptCompression` — unchanged
- Current strategy selection results — unchanged
- Current prompt output — unchanged

---

## Consequences

### Positive

1. **Scoring infrastructure** — enables future AI-based dynamic strategy routing
2. **Candidate transparency** — selection result exposes all candidates with scores
3. **Backward compatible** — DefaultStrategyEvaluator preserves exact existing behavior
4. **Pluggable** — custom StrategyEvaluator can replace scoring logic
5. **Foundation only** — no consumption by PromptBuilder, no behavior changes

### Negative

None.

### Neutral

1. Score range (0–100) is a convention, not enforced — custom evaluators may use different ranges
2. These types are not consumed by any existing component yet — future WO will integrate them

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All 2710 pass (zero modifications)
- **New tests**: `DynamicStrategySelectionFoundation.test.ts` with 42 comprehensive test cases
- **Total tests**: 2752 passing
- **No behavior changes**: Strategy selection, prompt output all unchanged

---

## References

- WO-S5-016 — Prompt Strategy Consumption (ADR-0063)
- `packages/ai/src/strategy/StrategyCandidate.ts`
- `packages/ai/src/strategy/StrategySelectionResult.ts`
- `packages/ai/src/strategy/StrategyEvaluator.ts`
- `packages/ai/src/strategy/DefaultStrategyEvaluator.ts`
