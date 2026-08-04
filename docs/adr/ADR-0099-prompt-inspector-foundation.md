# ADR-0099: Prompt Inspector Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-052  
**Architecture Version:** v0.87

---

## Context

The Prompt Assembly Snapshot (WO-S5-050, ADR-0097) provides a unified diagnostics structure — but it is a **flat data structure** with typed fields. Consumers who want to render or inspect the assembly process need a **domain model** that transforms the typed snapshot into a human-readable, section-based format.

### Problem

1. **No domain model** — the snapshot is a data structure, not an inspection model
2. **No section abstraction** — consumers must understand each snapshot field individually
3. **No uniform viewer** — no standardized way to present assembly diagnostics

---

## Decision

### PromptInspector

Introduced as a domain model for prompt assembly inspection:

```typescript
interface PromptInspector {
  readonly strategy?: string
  readonly sections: readonly PromptInspectorSection[]
}
```

### PromptInspectorSection

A single labeled section within the inspector:

```typescript
interface PromptInspectorSection {
  readonly title: string
  readonly content: unknown
}
```

### PromptInspectorBuilder

Converts a `PromptAssemblySnapshot` into a `PromptInspector`:

```typescript
interface PromptInspectorBuilder {
  build(snapshot: PromptAssemblySnapshot): PromptInspector
}
```

### DefaultPromptInspectorBuilder

Default implementation that maps snapshot fields to labeled sections:

| Snapshot Field | Section Title |
|---------------|---------------|
| `strategyRendered` | "Rendered Strategy" |
| `strategySelection` | "Strategy Selection" |
| `strategyModule` | "Strategy Module" |
| `plan` | "Prompt Plan" |
| `optimizedPlan` | "Optimized Plan" |
| `planDiff` | "Plan Diff" |
| `planRendered` | "Rendered Plan" |

The `strategy` field maps directly to `inspector.strategy` (not a section).  
Fields not in this mapping (e.g., `strategyModuleRendered`) are silently ignored.

### Section Ordering

Sections are produced in a consistent, deterministic order:
1. Rendered Strategy
2. Strategy Selection
3. Strategy Module
4. Prompt Plan
5. Optimized Plan
6. Plan Diff
7. Rendered Plan

This order is independent of input field order — the same snapshot always produces the same section sequence.

### NOT Modified

- `PromptBuilder` — unchanged
- `PromptRenderer` — unchanged
- `PromptCompression` — unchanged
- `Planner` — unchanged
- `Runtime` — unchanged
- `AgentLoop` — unchanged
- `PromptAssemblySnapshot` — unchanged
- Prompt output — unchanged (foundation only, not consumed)

---

## Consequences

### Positive

1. **Domain model** — the inspector provides a human-readable, section-based view
2. **Uniform abstraction** — all assembly diagnostics are presented as labeled sections
3. **Forward compatible** — new sections can be added without breaking changes
4. **Backward compatible** — no modifications to any existing component
5. **Pure, stateless, deterministic** — same snapshot always produces same inspector

### Negative

None.

### Neutral

1. The inspector is not yet consumed by any component — foundation only
2. Only 7 of 9 snapshot fields are mapped; strategyModuleRendered is excluded
3. Section content type is `unknown` — consumers must handle type per title

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All 4034 pass (zero modifications)
- **New tests**: `PromptInspectorFoundation.test.ts` with 74 test cases
- **Total tests**: 4108 passing
- **No breaking changes** to any Public API

---

## References

- WO-S5-050 — Prompt Assembly Snapshot Foundation (ADR-0097)
- WO-S5-051 — Prompt Assembly Snapshot Consumption (ADR-0098)
- WO-S5-052 — This Work Order
- `packages/ai/src/strategy/PromptInspector.ts`
- `packages/ai/src/strategy/PromptInspectorSection.ts`
- `packages/ai/src/strategy/PromptInspectorBuilder.ts`
- `packages/ai/src/strategy/DefaultPromptInspectorBuilder.ts`
- `packages/ai/src/__tests__/PromptInspectorFoundation.test.ts`