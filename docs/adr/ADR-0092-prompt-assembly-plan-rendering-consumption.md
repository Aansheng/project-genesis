# ADR-0092: Prompt Assembly Plan Rendering Consumption

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-045  
**Architecture Version:** v0.80

---

## Context

WO-S5-044 introduced `PromptAssemblyPlanRenderer` and `DefaultPromptAssemblyPlanRenderer` for rendering `PromptAssemblyPlan` into a human-readable string. The renderer was defined but not consumed by `DefaultPromptBuilder`.

The plan existed in metadata as raw structured data but had no rendered string representation for inspection.

### Problem

1. **Renderer not consumed** — `PromptAssemblyPlanRenderer` exists but is not invoked during build
2. **No rendered plan** — `metadata.promptAssembly.planRendered` does not exist
3. **No extension point** — `BuilderOptions` has no field for a plan renderer

---

## Decision

### BuilderOptions

Add the optional `promptAssemblyPlanRenderer` field:

```typescript
interface BuilderOptions {
  // ...
  promptAssemblyPlanRenderer?: PromptAssemblyPlanRenderer  // ← WO-S5-045
}
```

### DefaultPromptBuilder

Add private field and wire through both constructor paths:

```typescript
private readonly promptAssemblyPlanRenderer?: PromptAssemblyPlanRenderer
```

- BuilderOptions form: `this.promptAssemblyPlanRenderer = opts.promptAssemblyPlanRenderer`
- Legacy positional form: `this.promptAssemblyPlanRenderer = undefined`

### Phase 0.957

Insert between Phase 0.955 (PromptAssemblyPlanner) and Phase 0.96 (PromptAssemblyStrategy):

```
Phase 0.955: PromptAssemblyPlanner.buildPlan() → PromptAssemblyPlan
    ↓
Phase 0.957: PromptAssemblyPlanRenderer.render(plan) → planRendered
    ↓             → metadata.promptAssembly.planRendered
Phase 0.96:  PromptAssemblyStrategyResolver.resolve() → assemblyStrategy
```

Implementation:

```typescript
let promptAssemblyPlanRendered: string | undefined
if (promptAssemblyPlan !== undefined && this.promptAssemblyPlanRenderer !== undefined) {
  promptAssemblyPlanRendered = this.promptAssemblyPlanRenderer.render(promptAssemblyPlan)
}
```

Only renders when both `promptAssemblyPlan` and `promptAssemblyPlanRenderer` exist. Stored in `metadata.promptAssembly.planRendered`. Metadata only — no prompt injection.

### NOT Modified

- `PromptRenderer` — unchanged
- `PromptContext` — unchanged
- `PromptCompression` — unchanged
- `PromptAssemblyPlan` — unchanged
- `PromptAssemblyPlanRenderer` — unchanged
- Runtime, Planner, AgentLoop — unchanged

---

## Consequences

### Positive

1. **Renderer consumed** — `PromptAssemblyPlanRenderer` is invoked during build
2. **Rendered plan metadata** — `planRendered` stored in `metadata.promptAssembly`
3. **No prompt impact** — metadata only, no behavior change
4. **Backward compatible** — optional field, all existing code unchanged

### Negative

None.

### Neutral

1. Phase 0.957 sits between Phase 0.955 (plan creation) and Phase 0.96 (strategy resolution)
2. The rendered plan is only stored in metadata — not injected into the final prompt

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All 3670 pass (zero modifications)
- **New tests**: `PromptAssemblyPlanRenderingConsumption.test.ts` with 41 test cases
- **Total tests**: 3711 passing
- **No breaking changes** to any Public API

---

## References

- WO-S5-044 — Prompt Assembly Plan Rendering Foundation (ADR-0091)
- `packages/ai/src/prompt/BuilderOptions.ts`
- `packages/ai/src/prompt/DefaultPromptBuilder.ts`
- `packages/ai/src/__tests__/PromptAssemblyPlanRenderingConsumption.test.ts`