# ADR-0093: Prompt Assembly Optimizer Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-046  
**Architecture Version:** v0.81

---

## Context

The current Prompt Assembly pipeline produces a `PromptAssemblyPlan` that is consumed directly by `PriorityAwarePromptAssemblyStrategy`:

```
PromptAssemblyPlan
    ↓
PriorityAwarePromptAssemblyStrategy
    ↓
Prompt
```

There is no optimization layer between plan creation and strategy consumption. Future WOs will require plan optimizations such as:

- **Trimming** — removing low-priority sections when budget is tight
- **Compression** — replacing verbose sections with compressed alternatives
- **Priority adjustment** — elevating or demoting sections based on runtime conditions
- **Section merging** — combining related sections

### Problem

1. **No extension point** — no abstraction between plan creation and strategy consumption
2. **No optimization foundation** — future optimization features have nowhere to plug in
3. **Tight coupling** — planner output feeds directly into strategy, leaving no room for transformation

---

## Decision

### PromptAssemblyOptimizer

Introduce an optimization interface between `PromptAssemblyPlan` and the strategy layer:

```typescript
interface PromptAssemblyOptimizer {
  optimize(plan: PromptAssemblyPlan): PromptAssemblyPlan
}
```

The architecture becomes:

```
PromptAssemblyPlan
    ↓
PromptAssemblyOptimizer
    ↓
OptimizedPromptAssemblyPlan (currently: PromptAssemblyPlan)
    ↓
PriorityAwarePromptAssemblyStrategy
    ↓
Prompt
```

### DefaultPromptAssemblyOptimizer

Identity implementation — returns the plan unchanged:

```typescript
class DefaultPromptAssemblyOptimizer implements PromptAssemblyOptimizer {
  optimize(plan: PromptAssemblyPlan): PromptAssemblyPlan {
    return plan
  }
}
```

Properties:
- **Pure** — same plan always produces same optimized plan
- **Stateless** — no internal state between calls
- **Deterministic** — no randomness or external factors
- **Immutable** — never modifies the input plan
- **Identity** — returns the same object reference (zero-cost passthrough)

### Future Optimizer Implementations (Not Yet Implemented)

| Optimizer | Mechanism | Future WO |
|-----------|-----------|-----------|
| `TrimmingPromptAssemblyOptimizer` | Remove low-priority sections | Future |
| `CompressingPromptAssemblyOptimizer` | Replace sections with compressed variants | Future |
| `PriorityAdjustingPromptAssemblyOptimizer` | Adjust priorities based on runtime | Future |
| `CombiningPromptAssemblyOptimizer` | Merge related sections | Future |

### NOT Modified

- `PromptAssemblyPlan` — unchanged
- `PromptAssemblyPlanner` — unchanged
- `PriorityAwarePromptAssemblyStrategy` — unchanged
- `PromptBuilder` — unchanged (foundation only, not consumed)
- `PromptRenderer` — unchanged
- `PromptCompression` — unchanged
- `BuilderOptions` — unchanged
- `Planner` — unchanged
- `Runtime` — unchanged
- `AgentLoop` — unchanged
- Prompt output — unchanged

---

## Consequences

### Positive

1. **Extension point established** — optimizer fits between plan and strategy
2. **Foundation only** — no integration with PromptBuilder, no behavioral changes
3. **Backward compatible** — no modifications to any existing component
4. **Zero-cost passthrough** — identity implementation returns the same object reference
5. **Pure, stateless, deterministic** — same input always produces same output

### Negative

None.

### Neutral

1. The optimizer is not yet consumed by PromptBuilder — integration deferred to future WO
2. The identity implementation is the foundation for future optimization features
3. Architecture introduces a new layer without changing any behavior

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All 3711 pass (zero modifications)
- **New tests**: `PromptAssemblyOptimizerFoundation.test.ts` with 40+ test cases
- **Total tests**: 3751+ passing
- **No breaking changes** to any Public API

---

## References

- WO-S5-040 — Section Priority Foundation (ADR-0087)
- WO-S5-042 — Priority-Aware Prompt Assembly (ADR-0089)
- WO-S5-046 — This Work Order
- `packages/ai/src/strategy/PromptAssemblyOptimizer.ts`
- `packages/ai/src/strategy/DefaultPromptAssemblyOptimizer.ts`
- `packages/ai/src/__tests__/PromptAssemblyOptimizerFoundation.test.ts`