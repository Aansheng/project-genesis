# ADR-0088: Prompt Assembly Planner Consumption

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-041  
**Architecture Version:** v0.76

---

## Context

WO-S5-040 introduced `PromptAssemblyPlanner`, `PromptAssemblyPlan`, and `PromptSectionPriority` as a planning layer for section prioritization. These interfaces were defined but not consumed by `DefaultPromptBuilder`.

The PromptAssemblyPlan was produced but not stored. There was no way for downstream code to inspect the section priority plan.

### Problem

1. **Planner not consumed** — `PromptAssemblyPlanner` exists but `DefaultPromptBuilder` does not invoke it
2. **No plan metadata** — the `PromptAssemblyPlan` is not stored in `metadata.promptAssembly.plan`
3. **No extension point** — `BuilderOptions` has no field for a planner

---

## Decision

### BuilderOptions

Add the optional `promptAssemblyPlanner` field:

```typescript
interface BuilderOptions {
  // ...
  promptAssemblyPlanner?: PromptAssemblyPlanner  // ← WO-S5-041
}
```

### DefaultPromptBuilder

Add private field and wire through both constructor paths:

```typescript
private readonly promptAssemblyPlanner?: PromptAssemblyPlanner
```

- BuilderOptions form: `this.promptAssemblyPlanner = opts.promptAssemblyPlanner`
- Legacy positional form: `this.promptAssemblyPlanner = undefined`

### Phase 0.955

Insert between Phase 0.95 (Strategy Rendering) and Phase 0.96 (Prompt Assembly Strategy):

```
Phase 0.95:  PromptStrategyRenderer.render() → strategyRendered
    ↓
Phase 0.955: PromptAssemblyPlanner.buildPlan(strategyName, sectionKeys)
    ↓             → PromptAssemblyPlan { priorities[] }
    ↓             → metadata.promptAssembly.plan
Phase 0.96:  PromptAssemblyStrategyResolver.resolve() → assemblyStrategy
```

Implementation:

```typescript
let promptAssemblyPlan: PromptAssemblyPlan | undefined
if (this.promptAssemblyPlanner !== undefined && selectedStrategy !== undefined) {
  const sectionKeys = Object.keys(promptContext)
  promptAssemblyPlan = this.promptAssemblyPlanner.buildPlan(
    selectedStrategy.name,
    sectionKeys,
  )
}
```

Stored in `metadata.promptAssembly.plan`. No prompt injection. Metadata only.

### NOT Modified

- `PromptContext` — unchanged
- `PromptRenderer` — unchanged
- `PromptCompression` — unchanged
- `PromptAssemblyStrategy` — unchanged
- `PromptAssemblyStrategyResolver` — unchanged
- Runtime, Planner, AgentLoop — unchanged

---

## Consequences

### Positive

1. **Planner consumed** — `PromptAssemblyPlanner` is invoked during build
2. **Plan metadata** — the plan is stored in `metadata.promptAssembly.plan` for inspection
3. **No prompt impact** — metadata only, no behavior change
4. **Backward compatible** — optional field, all existing code unchanged

### Negative

None.

### Neutral

1. The plan is generated before the renderContext is built, using `Object.keys(promptContext)` as section input
2. Phase 0.955 sits between Phase 0.95 and Phase 0.96 in the assembly pipeline

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All 3525 pass (zero modifications)
- **New tests**: `PromptAssemblyPlannerConsumption.test.ts` with 28 test cases
- **Total tests**: 3553 passing
- **No breaking changes** to any Public API

---

## References

- WO-S5-040 — Section Priority Foundation (ADR-0087)
- `packages/ai/src/prompt/BuilderOptions.ts`
- `packages/ai/src/prompt/DefaultPromptBuilder.ts`
- `packages/ai/src/__tests__/PromptAssemblyPlannerConsumption.test.ts`