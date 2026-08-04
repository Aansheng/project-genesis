# ADR-0095: Prompt Assembly Plan Diff Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-048  
**Architecture Version:** v0.83

---

## Context

WO-S5-046 introduced `PromptAssemblyOptimizer` and WO-S5-047 consumed it in `DefaultPromptBuilder` via Phase 0.956. The optimizer transforms `PromptAssemblyPlan` into an optimized plan, and both are stored in metadata. However, there is no way to inspect what changed between the original plan and the optimized plan.

### Problem

1. **No inspection** — no structured way to see what the optimizer changed
2. **No diff model** — added/removed sections and priority changes are invisible
3. **No diagnostics** — cannot log or debug optimization effects
4. **No extension point** — no abstraction for comparing two plans

---

## Decision

### PromptAssemblyPlanDiff

Introduce a pure data structure describing the differences between two plans:

```typescript
interface PromptAssemblyPlanDiff {
  readonly added: readonly string[]
  readonly removed: readonly string[]
  readonly changed: readonly {
    readonly section: string
    readonly before: number
    readonly after: number
  }[]
}
```

- `added` — sections present in "after" but not in "before"
- `removed` — sections present in "before" but not in "after"
- `changed` — sections whose priority value differs (with before/after values)

### PromptAssemblyPlanDiffer

```typescript
interface PromptAssemblyPlanDiffer {
  diff(before: PromptAssemblyPlan, after: PromptAssemblyPlan): PromptAssemblyPlanDiff
}
```

### DefaultPromptAssemblyPlanDiffer

Default implementation detecting:
- **Added sections** — in "after" not in "before", ordered by "after" plan
- **Removed sections** — in "before" not in "after", ordered by "before" plan
- **Changed priorities** — in both plans with different priority, ordered by "before" plan

Properties:
- **Pure** — same before/after always produces same diff
- **Stateless** — no internal state between calls
- **Deterministic** — no randomness or external factors, order follows input plans
- **Immutable** — never modifies either input plan; result is frozen
- **No sorting** — order is derived from the input plans, not re-sorted

### NOT Modified

- `PromptAssemblyPlan` — unchanged
- `PromptAssemblyOptimizer` — unchanged
- `PromptBuilder` — unchanged (foundation only, not consumed)
- `PromptRenderer` — unchanged
- `PromptCompression` — unchanged
- `Planner` — unchanged
- `Runtime` — unchanged
- `AgentLoop` — unchanged
- Prompt output — unchanged

---

## Consequences

### Positive

1. **Inspection capability** — structured diff of plan changes
2. **Foundation only** — no integration with PromptBuilder, no behavioral changes
3. **Backward compatible** — no modifications to any existing component
4. **Pure, stateless, deterministic** — same input always produces same diff
5. **Order preserved** — results follow input plan order (no surprise sorting)

### Negative

None.

### Neutral

1. The differ is not yet consumed by PromptBuilder or the optimizer — integration deferred to future WO
2. Ordering of `added`/`removed`/`changed` follows the input plans, not alphabetical order
3. Case-sensitive section name matching (sections are exact string keys)

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All 3802 pass (zero modifications)
- **New tests**: `PromptAssemblyPlanDiffFoundation.test.ts` with 60 test cases
- **Total tests**: 3862 passing
- **No breaking changes** to any Public API

---

## References

- WO-S5-046 — Prompt Assembly Optimizer Foundation (ADR-0093)
- WO-S5-047 — Prompt Assembly Optimizer Consumption (ADR-0094)
- WO-S5-048 — This Work Order
- `packages/ai/src/strategy/PromptAssemblyPlanDiff.ts`
- `packages/ai/src/strategy/PromptAssemblyPlanDiffer.ts`
- `packages/ai/src/strategy/DefaultPromptAssemblyPlanDiffer.ts`
- `packages/ai/src/__tests__/PromptAssemblyPlanDiffFoundation.test.ts`