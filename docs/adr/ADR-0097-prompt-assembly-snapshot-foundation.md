# ADR-0097: Prompt Assembly Snapshot Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-050  
**Architecture Version:** v0.85

---

## Context

Prompt assembly diagnostics are currently scattered across multiple `metadata.promptAssembly` fields:

- `strategy`
- `strategySelection`
- `strategyRendered`
- `strategyModule`
- `strategyModuleRendered`
- `plan`
- `optimizedPlan`
- `planDiff`
- `planRendered`

Consumers must understand the individual field names and shapes to inspect the prompt assembly state.

### Problem

1. **Scattered diagnostics** — no unified structure for prompt assembly state
2. **No single snapshot** — consumers must merge individual metadata fields
3. **No abstraction** — no type-safe way to read the full assembly state
4. **No inspection point** — no standardized snapshot for debugging/logging

---

## Decision

### PromptAssemblySnapshot

Introduce a unified snapshot structure consolidating all prompt assembly diagnostics:

```typescript
interface PromptAssemblySnapshot {
  readonly strategy?: string
  readonly strategySelection?: StrategySelectionMetadata
  readonly strategyRendered?: string
  readonly strategyModule?: string
  readonly strategyModuleRendered?: string
  readonly plan?: PromptAssemblyPlan
  readonly optimizedPlan?: PromptAssemblyPlan
  readonly planDiff?: PromptAssemblyPlanDiff
  readonly planRendered?: string
}
```

- All fields optional — snapshot contains only populated fields
- Readonly — immutable by design
- Pure data — no methods, no behavior
- Extensible — new fields added without breaking changes

### PromptAssemblySnapshotBuilder

```typescript
interface PromptAssemblySnapshotBuilder {
  build(metadata: Record<string, unknown>): PromptAssemblySnapshot
}
```

### DefaultPromptAssemblySnapshotBuilder

Default implementation that:
- Reads the 9 known promptAssembly metadata fields by key
- Extracts `strategy.name` from the `{ name }` strategy object
- Type-safe coercion via guard functions for each structured field
- Ignores unknown fields silently
- Skips empty strings and malformed structures

Properties:
- **Pure** — same metadata always produces same snapshot
- **Stateless** — no internal state between calls
- **Deterministic** — no randomness or external factors
- **Immutable** — never modifies the input metadata
- **Lenient** — unknown/malformed fields are ignored, never throw

### NOT Modified

- `PromptAssemblyPlan` — unchanged
- `PromptAssemblyOptimizer` — unchanged
- `PromptAssemblyPlanDiffer` — unchanged
- `StrategySelectionMetadata` — unchanged
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

1. **Unified snapshot** — all diagnostics in a single structure
2. **Foundation only** — no integration with PromptBuilder, no behavioral changes
3. **Backward compatible** — no modifications to any existing component
4. **Pure, stateless, deterministic** — same input always produces same snapshot
5. **Lenient parsing** — unknown fields ignored, never throws

### Negative

None.

### Neutral

1. The snapshot is not yet produced by PromptBuilder — consumption deferred to future WO
2. Only the 9 documented fields are recognized; future fields need builder updates
3. Empty strings are treated as absent (skipped)

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All 3908 pass (zero modifications)
- **New tests**: `PromptAssemblySnapshotFoundation.test.ts` with 79 test cases
- **Total tests**: 3987 passing
- **No breaking changes** to any Public API

---

## References

- WO-S5-046 — Prompt Assembly Optimizer Foundation (ADR-0093)
- WO-S5-048 — Prompt Assembly Plan Diff Foundation (ADR-0095)
- WO-S5-050 — This Work Order
- `packages/ai/src/strategy/PromptAssemblySnapshot.ts`
- `packages/ai/src/strategy/PromptAssemblySnapshotBuilder.ts`
- `packages/ai/src/strategy/DefaultPromptAssemblySnapshotBuilder.ts`
- `packages/ai/src/__tests__/PromptAssemblySnapshotFoundation.test.ts`