# ADR-0076: Strategy Selection Result Consumption

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-029  
**Architecture Version:** v0.64

---

## Context

WO-S5-027 established the `StrategyEvaluator` interface, `DefaultStrategyEvaluator`, `StrategyCandidate`, and `StrategySelectionResult`. WO-S5-028 upgraded `DefaultPromptStrategySelector` from first-match-wins to highest-score-wins, consuming the evaluator internally.

However, the full strategy selection result — the selected strategy plus all candidate scores — is not yet available to downstream consumers. `DefaultPromptBuilder` only stores `{ name: selectedStrategy.name }` in `metadata.promptAssembly.strategy`. The candidate scores computed during selection are lost.

### Current Behavior

```
Phase 0.9:  PromptStrategySelector.select(strategies, context) → selectedStrategy
            metadata.promptAssembly.strategy = { name: selectedStrategy.name }
            // Candidate scores are computed inside the selector but not exposed
```

### Problem

1. **No score transparency** — metadata only has the winner, not the full score table
2. **No routing readiness** — Multi Strategy Routing needs candidate scores for dynamic decisions
3. **No inspection** — debugging and observability can't see why a strategy was selected

---

## Decision

### StrategySelectionMetadata

Create a lightweight metadata-friendly interface that captures the full selection result:

```typescript
interface StrategySelectionMetadata {
  readonly selected: string
  readonly candidates: readonly {
    readonly strategy: string
    readonly score: number
  }[]
}
```

Strategy objects are reduced to their names — keeping the structure small, serializable, and inspection-ready.

### BuilderOptions Extension

Add `strategyEvaluator?: StrategyEvaluator` to `BuilderOptions`:

```typescript
interface BuilderOptions {
  // ... existing fields ...
  strategyEvaluator?: StrategyEvaluator  // ← WO-S5-029
}
```

When both `strategyEvaluator` and `strategies` are provided to `DefaultPromptBuilder`, the builder independently evaluates each strategy and captures the full candidate score table into `metadata.promptAssembly.strategySelection`.

### Phase 0.91 — StrategySelectionMetadata

After Phase 0.9 (strategy selection), add Phase 0.91:

```
Phase 0.9:   PromptStrategySelector.select(strategies, context) → selectedStrategy
Phase 0.91:  StrategyEvaluator.evaluate() for each strategy
             → StrategySelectionMetadata { selected, candidates }
             → metadata.promptAssembly.strategySelection
```

The selected strategy still comes from `strategySelector.select()` — this WO does NOT change strategy selection behavior. The evaluator is used purely for metadata capture.

### NOT Modified

- `PromptContext` — unchanged
- `PromptRenderer` — unchanged
- `PromptCompression` — unchanged
- `Pipeline` — unchanged
- `Planner` — unchanged
- `Runtime` — unchanged
- `AgentLoop` — unchanged
- `StrategyModule` — unchanged
- `StrategyRenderer` — unchanged
- Prompt output — unchanged

---

## Consequences

### Positive

1. **Score transparency** — full candidate scores visible in metadata
2. **Multi Strategy Routing readiness** — downstream can inspect scores for dynamic decisions
3. **Backward compatible** — prompt output unchanged, metadata additive only
4. **Optional** — `strategyEvaluator` in BuilderOptions is optional; no metadata when absent
5. **All 2782 existing tests pass** — zero behavior changes
6. **Serializable** — only primitive types (string, number), no object references

### Negative

None.

### Neutral

1. The evaluator in `DefaultPromptBuilder` runs independently of the selector — both may evaluate the same strategies. This is acceptable since evaluation is pure and cheap.
2. `StrategySelectionResult` (the full object-graph version) exists but is not yet used by `DefaultPromptBuilder` — this WO uses the lighter `StrategySelectionMetadata` instead.

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All 2782 pass (zero modifications)
- **New tests**: `StrategySelectionResultConsumption.test.ts` with 36 comprehensive test cases
- **Total tests**: 2818 passing
- **Backward compatibility**: Verified — prompt output identical with and without strategyEvaluator
- **Metadata**: New `strategySelection` field in `metadata.promptAssembly`, coexisting with `strategy`, `strategyRendered`, `strategyModule`, `strategyModuleRendered`

---

## References

- WO-S5-027 — Dynamic Strategy Selection Foundation (ADR-0074)
- WO-S5-028 — Score Based Strategy Selection (ADR-0075)
- WO-S5-016 — Prompt Strategy Consumption (ADR-0063)
- `packages/ai/src/strategy/StrategySelectionMetadata.ts`
- `packages/ai/src/prompt/DefaultPromptBuilder.ts`
