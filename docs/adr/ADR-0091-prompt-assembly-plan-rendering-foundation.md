# ADR-0091: Prompt Assembly Plan Rendering Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-044  
**Architecture Version:** v0.79

---

## Context

WO-S5-040 introduced `PromptAssemblyPlan` as the output of `PromptAssemblyPlanner`. WO-S5-041 consumed the planner in `DefaultPromptBuilder`, storing the plan in `metadata.promptAssembly.plan`. WO-S5-043 introduced `StrategyAwarePromptAssemblyPlanner` with distinct priority plans per strategy.

However, the plan is only available as raw structured data. There is no human-readable representation for inspection, debugging, or logging.

### Problem

1. **No human-readable rendering** — the plan is only available as `{ priorities: [{ section, priority }] }`
2. **No inspection** — downstream consumers cannot easily inspect the plan as a formatted string
3. **No extension point** — no abstraction for rendering plan data

---

## Decision

### PromptAssemblyPlanRenderer

Introduce a rendering interface for PromptAssemblyPlan:

```typescript
interface PromptAssemblyPlanRenderer {
  render(plan: PromptAssemblyPlan): string
}
```

### DefaultPromptAssemblyPlanRenderer

Default implementation producing a human-readable format:

```
Prompt Assembly Plan

1. userInput (100)
2. worldState (90)
3. memory (80)
```

Empty plan:

```
Prompt Assembly Plan

(no sections)
```

Sorting:
- Sections sorted by priority descending
- Original order as tie-breaker (stable sort)
- Sequential numbering (1, 2, 3, ...)

Properties:
- Pure: same plan always produces same string
- Stateless: no internal state between calls
- Deterministic: no randomness or external factors
- Immutable: never modifies the input plan

### NOT Modified

- `PromptAssemblyPlan` — unchanged
- `PromptAssemblyPlanner` — unchanged
- `PromptBuilder` — unchanged
- `PromptRenderer` — unchanged
- `PromptCompression` — unchanged
- `BuilderOptions` — unchanged
- Runtime, Planner, AgentLoop — unchanged
- Prompt output — unchanged

---

## Consequences

### Positive

1. **Human-readable plans** — plan data available as formatted string
2. **Foundation only** — no integration with PromptBuilder, no behavioral changes
3. **Backward compatible** — no modifications to any existing component
4. **Pure, stateless, deterministic** — same input always produces same output

### Negative

None.

### Neutral

1. The rendered output is not yet injected into the prompt or metadata — integration deferred to future WO
2. Sorting is by priority descending, with stable tie-breaking via original order

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All 3630 pass (zero modifications)
- **New tests**: `PromptAssemblyPlanRenderingFoundation.test.ts` with 40 test cases
- **Total tests**: 3670 passing
- **No breaking changes** to any Public API

---

## References

- WO-S5-040 — Section Priority Foundation (ADR-0087)
- WO-S5-041 — Prompt Assembly Planner Consumption (ADR-0088)
- WO-S5-043 — Strategy-Aware Prompt Assembly Planner (ADR-0090)
- `packages/ai/src/strategy/PromptAssemblyPlanRenderer.ts`
- `packages/ai/src/strategy/DefaultPromptAssemblyPlanRenderer.ts`
- `packages/ai/src/__tests__/PromptAssemblyPlanRenderingFoundation.test.ts`