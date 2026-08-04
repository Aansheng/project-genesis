# ADR-0089: Priority-Aware Prompt Assembly

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-042  
**Architecture Version:** v0.77

---

## Context

WO-S5-040 introduced `PromptAssemblyPlanner` and `PromptAssemblyPlan` as a planning layer for section prioritization. WO-S5-041 consumed the planner in `DefaultPromptBuilder` Phase 0.955, storing the plan in metadata.

However, the plan was stored but never used to influence section ordering. The `PromptAssemblyStrategy.apply()` method continued to use hardcoded reordering logic, ignoring the priority values in the plan.

### Problem

1. **Plan not consumed** — `PromptAssemblyPlan` exists in metadata but has no effect on section ordering
2. **No priority-aware ordering** — sections are reordered by hardcoded strategy logic, not plan priorities
3. **No extension point** — no interface for plan-aware section reordering

---

## Decision

### PriorityAwarePromptAssemblyStrategy

Extend `PromptAssemblyStrategy` with a plan-aware interface:

```typescript
interface PriorityAwarePromptAssemblyStrategy extends PromptAssemblyStrategy {
  applyPlan(sections: readonly string[], plan: PromptAssemblyPlan): readonly string[]
}
```

### DefaultPriorityAwarePromptAssemblyStrategy

Default implementation:

- `applyPlan()` sorts sections by priority descending (higher priority first)
- Stable sort: when priorities tie, original relative order is preserved
- Sections not in the plan receive priority 0 (placed at end)
- `apply()` returns sections unchanged (identity — no-op without a plan)

### DefaultPromptBuilder Phase 0.96

When both a `PromptAssemblyPlan` and a `PriorityAwarePromptAssemblyStrategy` are available:

1. Use `applyPlan()` instead of `apply()` for section reordering
2. Set `metadata.promptAssembly.planApplied = true`

When either is unavailable:
1. Use existing `apply()` behavior (backward compatible)
2. Set `metadata.promptAssembly.planApplied = false`

### Architecture Flow

```
Before (v0.76):
  PromptAssemblyPlanner → PromptAssemblyPlan → metadata only
  PromptAssemblyStrategy → apply() → hardcoded reordering

After (v0.77):
  PromptAssemblyPlanner → PromptAssemblyPlan
    ↓
  PriorityAwarePromptAssemblyStrategy → applyPlan(sections, plan)
    ↓
  priority-based section ordering → prompt
```

### NOT Modified

- `PromptRenderer` — unchanged
- `PromptCompression` — unchanged
- `PromptAssemblyStrategy` interface — unchanged (extended, not modified)
- `PromptAssemblyPlan` — unchanged
- `PromptAssemblyPlanner` — unchanged
- `BuilderOptions` — unchanged (no new fields)
- Runtime, Planner, AgentLoop, PromptContext — unchanged

---

## Consequences

### Positive

1. **Plan consumed** — `PromptAssemblyPlan` now affects section ordering
2. **Priority-based ordering** — sections are ordered by plan priority
3. **Stable sort** — deterministic behavior for ties
4. **Backward compatible** — all existing strategies continue working unchanged
5. **Metadata indication** — `planApplied` flag indicates whether priority-aware ordering was used

### Negative

None.

### Neutral

1. The existing `promptAssemblyStrategyResolver` strategies must implement `PriorityAwarePromptAssemblyStrategy` for plan-aware ordering to take effect
2. When no plan-aware strategy is available, behavior is identical to v0.76

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All 3553 pass (zero modifications)
- **New tests**: `PriorityAwarePromptAssembly.test.ts` with 30 test cases
- **Total tests**: 3583 passing
- **No breaking changes** to any Public API

---

## References

- WO-S5-040 — Section Priority Foundation (ADR-0087)
- WO-S5-041 — Prompt Assembly Planner Consumption (ADR-0088)
- `packages/ai/src/strategy/PriorityAwarePromptAssemblyStrategy.ts`
- `packages/ai/src/strategy/DefaultPriorityAwarePromptAssemblyStrategy.ts`
- `packages/ai/src/prompt/DefaultPromptBuilder.ts`
- `packages/ai/src/__tests__/PriorityAwarePromptAssembly.test.ts`