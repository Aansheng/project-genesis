# ADR-0087: Section Priority Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-040  
**Architecture Version:** v0.75

---

## Context

The Prompt Assembly layer currently supports section reordering via `PromptAssemblyStrategy`, but has no explicit planning mechanism to determine how sections should be prioritized before assembly.

Each `PromptAssemblyStrategy.apply()` reorders sections based on hardcoded logic. There is no intermediate representation that captures why a section should be placed in a particular position — the priorities are implicit in the strategy implementation.

### Problem

1. **No priority abstraction** — section priority is implicit in `apply()` logic, not explicitly modeled
2. **No planning layer** — no separation between "what sections should be prioritized" and "how to reorder them"
3. **No extension point** — custom priority logic requires overriding the entire strategy

---

## Decision

### Introduce Three New Interfaces

#### 1. PromptSectionPriority

The atomic unit of priority — a section name paired with its priority value:

```typescript
interface PromptSectionPriority {
  readonly section: string
  readonly priority: number
}
```

#### 2. PromptAssemblyPlan

The output of planning — an ordered collection of section priorities:

```typescript
interface PromptAssemblyPlan {
  readonly priorities: readonly PromptSectionPriority[]
}
```

#### 3. PromptAssemblyPlanner

The planning interface — produces a plan from strategy name and available sections:

```typescript
interface PromptAssemblyPlanner {
  buildPlan(strategyName: string, sections: readonly string[]): PromptAssemblyPlan
}
```

### DefaultPromptAssemblyPlanner

Default implementation with baseline behavior:

- **Preserves section order** — priorities array matches input sections order
- **All priorities = 100** — neutral default, no behavioral change
- **Deterministic** — same inputs always produce same plan
- **Stateless** — no internal state between calls
- **Pure** — no side effects, does not modify inputs

### Architecture

```
Before (v0.74):
  PromptAssemblyStrategy
    ↓ apply()
    ↓ reorder
    ↓ prompt

After (v0.75):
  PromptAssemblyPlanner
    ↓ buildPlan(strategyName, sections)
    ↓ PromptAssemblyPlan
    ↓ PromptAssemblyStrategy
    ↓ apply()
    ↓ prompt
```

### NOT Modified

- `PromptBuilder` — unchanged
- `PromptRenderer` — unchanged
- `PromptCompression` — unchanged
- `BuilderOptions` — unchanged (no new fields)
- `PromptAssemblyStrategy` — unchanged
- Planner, Runtime, AgentLoop — unchanged
- Prompt output — unchanged

---

## Consequences

### Positive

1. **Explicit priority model** — sections now have an explicit priority mechanism
2. **Planning/execution separation** — `PromptAssemblyPlanner` owns the "what", `PromptAssemblyStrategy` owns the "how"
3. **Backward compatible** — no modifications to any existing component
4. **Foundation for future work** — `PromptAssemblyPlanner` enables strategy-specific priority assignments

### Negative

None.

### Neutral

1. Foundation only — `DefaultPromptAssemblyPlanner` does not change any existing behavior
2. No integration with `DefaultPromptBuilder` — consumption deferred to future work order

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All 3498 pass (zero modifications)
- **New tests**: `PromptAssemblyPlannerFoundation.test.ts` with 27 test cases
- **Total tests**: 3525 passing
- **No breaking changes** to any Public API

---

## References

- `packages/ai/src/strategy/PromptSectionPriority.ts`
- `packages/ai/src/strategy/PromptAssemblyPlan.ts`
- `packages/ai/src/strategy/PromptAssemblyPlanner.ts`
- `packages/ai/src/strategy/DefaultPromptAssemblyPlanner.ts`
- `packages/ai/src/__tests__/PromptAssemblyPlannerFoundation.test.ts`