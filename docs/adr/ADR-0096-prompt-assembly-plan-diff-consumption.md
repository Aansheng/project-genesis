# ADR-0096: Prompt Assembly Plan Diff Consumption

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-049  
**Architecture Version:** v0.84

---

## Context

WO-S5-048 introduced `PromptAssemblyPlanDiff`, `PromptAssemblyPlanDiffer`, and `DefaultPromptAssemblyPlanDiffer` as a foundation diff model. However, the differ was not consumed by `DefaultPromptBuilder`.

### Problem

1. **Differ not wired** — `DefaultPromptBuilder` does not use the differ
2. **No diff phase** — no Phase 0.9565 between Phase 0.956 (Optimizer) and Phase 0.957 (Renderer)
3. **No metadata** — `planDiff` not stored in `metadata.promptAssembly`
4. **No inspection** — cannot see what the optimizer changed during build

---

## Decision

### BuilderOptions

Add `promptAssemblyPlanDiffer?: PromptAssemblyPlanDiffer` to `BuilderOptions`:

```typescript
interface BuilderOptions {
  // ... existing fields ...
  promptAssemblyPlanDiffer?: PromptAssemblyPlanDiffer
}
```

### DefaultPromptBuilder

Add `private readonly promptAssemblyPlanDiffer?: PromptAssemblyPlanDiffer` field, wired from `BuilderOptions` form. Legacy positional form sets `undefined`.

### Phase 0.9565

Insert between Phase 0.956 and Phase 0.957:

```
Phase 0.955: PromptAssemblyPlanner → plan
Phase 0.956: PromptAssemblyOptimizer → optimizedPlan
Phase 0.9565: PromptAssemblyPlanDiffer → planDiff         ← NEW
Phase 0.957: PromptAssemblyPlanRenderer → planRendered
```

Flow:
1. `PromptAssemblyPlanner.buildPlan()` → `promptAssemblyPlan`
2. `PromptAssemblyOptimizer.optimize(promptAssemblyPlan)` → `optimizedPlan`
3. `PromptAssemblyPlanDiffer.diff(promptAssemblyPlan, optimizedPlan)` → `planDiff`
4. `PromptAssemblyPlanRenderer.render()` (uses `optimizedPlan ?? promptAssemblyPlan`)

Only invoked when **all three** exist: plan, optimizedPlan, and differ.

### Metadata

Store `planDiff` in `metadata.promptAssembly.planDiff`:

- `{ planDiff }` with `added`, `removed`, `changed` arrays
- Only stored when planner, optimizer, and differ all exist
- Coexists with `plan`, `optimizedPlan`, `planRendered`, `strategy`, etc.

### Identity Behavior

With `DefaultPromptAssemblyOptimizer` (identity) and `DefaultPromptAssemblyPlanDiffer`:
- `planDiff` has empty `added`, `removed`, `changed` (no diff between identical plans)
- Prompt output is identical with or without differ
- No behavioral changes

### NOT Modified

- `PromptAssemblyPlan` — unchanged
- `PromptAssemblyOptimizer` — unchanged
- `PromptAssemblyPlanDiffer` — unchanged
- `PromptAssemblyPlanRenderer` — unchanged
- `PromptRenderer` — unchanged
- `PromptCompression` — unchanged
- `Planner` — unchanged
- `Runtime` — unchanged
- `AgentLoop` — unchanged
- Prompt output — unchanged

---

## Consequences

### Positive

1. **Differ consumed** — Phase 0.9565 integrates differ into the build pipeline
2. **Metadata captured** — `planDiff` stored in `metadata.promptAssembly`
3. **Inspection enabled** — can see what the optimizer changed
4. **Identity passthrough** — empty diff with identity optimizer
5. **Backward compatible** — optional field, no constructor signature change
6. **No prompt output changes** — metadata only, no prompt injection

### Negative

None.

### Neutral

1. The diff is only produced when planner + optimizer + differ all exist
2. With identity optimizer, the diff is always empty (before === after)
3. Real diffs will appear only when a non-identity optimizer is configured

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All 3862 pass (zero modifications)
- **New tests**: `PromptAssemblyPlanDiffConsumption.test.ts` with 46 test cases
- **Total tests**: 3908 passing
- **No breaking changes** to any Public API

---

## References

- WO-S5-046 — Prompt Assembly Optimizer Foundation (ADR-0093)
- WO-S5-047 — Prompt Assembly Optimizer Consumption (ADR-0094)
- WO-S5-048 — Prompt Assembly Plan Diff Foundation (ADR-0095)
- WO-S5-049 — This Work Order
- `packages/ai/src/prompt/BuilderOptions.ts`
- `packages/ai/src/prompt/DefaultPromptBuilder.ts`
- `packages/ai/src/__tests__/PromptAssemblyPlanDiffConsumption.test.ts`