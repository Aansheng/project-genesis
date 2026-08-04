# ADR-0105: Prompt Assembly Trace Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-058  
**Architecture Version:** v0.92

---

## Context

The Prompt Assembly Pipeline currently produces rich diagnostic artifacts — strategy, strategySelection, plan, optimizedPlan, planDiff, snapshot, inspector, inspectorRendered, inspectorExported — but these are stored as **individual fields** within `metadata.promptAssembly`.

### Problems

1. **No unified trace domain model** — there is no single object representing the complete prompt assembly lifecycle
2. **Scattered diagnostics** — consumers must understand each individual metadata field name and location
3. **No trace builder** — no abstraction exists to construct a trace from raw metadata
4. **Foundation incomplete** — downstream tools (Debug Panel, Timeline, Diff Viewer, Strategy Inspector) cannot consume a unified trace

---

## Decision

### New Interface — PromptAssemblyTrace

Create `PromptAssemblyTrace` in `packages/ai/src/strategy/PromptAssemblyTrace.ts`:

```typescript
export interface PromptAssemblyTrace {
  readonly strategy?: unknown
  readonly strategySelection?: unknown
  readonly plan?: unknown
  readonly optimizedPlan?: unknown
  readonly planDiff?: unknown
  readonly snapshot?: unknown
  readonly inspector?: unknown
  readonly inspectorRendered?: string
  readonly inspectorExported?: string
}
```

- All fields are `unknown` except `inspectorRendered` and `inspectorExported` (string)
- All fields are optional — the trace only contains populated fields
- All fields are readonly — immutable by design
- Pure data structure — no methods, no behavior
- No dependencies on Planner, Runtime, Provider, or Pipeline
- Extensible — new fields can be added without breaking changes

### New Interface — PromptAssemblyTraceBuilder

Create `PromptAssemblyTraceBuilder` in `packages/ai/src/strategy/PromptAssemblyTraceBuilder.ts`:

```typescript
export interface PromptAssemblyTraceBuilder {
  build(metadata: Record<string, unknown>): PromptAssemblyTrace
}
```

- Single method: accepts raw metadata → returns structured trace
- Pure: same metadata always produces same trace
- Stateless: no internal state between calls
- Deterministic: no randomness or external factors
- No side effects: does not modify the metadata

### Default Implementation — DefaultPromptAssemblyTraceBuilder

Create `DefaultPromptAssemblyTraceBuilder` in `packages/ai/src/strategy/DefaultPromptAssemblyTraceBuilder.ts`:

- Reads the following known fields from `metadata.promptAssembly`:
  - `strategy` — extracted from `{ name: string }` object
  - `strategySelection` — object with `selected` and `candidates` fields
  - `plan` — object with `priorities` array
  - `optimizedPlan` — object with `priorities` array
  - `planDiff` — object with `added`, `removed`, `changed` arrays
  - `snapshot` — non-empty object
  - `inspector` — object with `sections` array
  - `inspectorRendered` — non-empty string
  - `inspectorExported` — non-empty string
- Unknown fields are silently ignored
- Type-narrowing guards for each field
- Pure, stateless, deterministic, immutable

### NOT Modified

- `PromptBuilder` — unchanged
- `BuilderOptions` — unchanged
- `PromptRenderer` — unchanged
- `PromptCompression` — unchanged
- `Planner` — unchanged
- `Runtime` — unchanged
- `AgentLoop` — unchanged
- `Pipeline` — unchanged
- `PromptInspector` — unchanged
- `PromptInspectorBuilder` — unchanged
- `PromptInspectorRenderer` — unchanged
- `PromptInspectorExporter` — unchanged
- `PromptAssemblySnapshot` — unchanged
- `PromptAssemblySnapshotBuilder` — unchanged
- `DefaultPromptBuilder` — unchanged
- No prompt output changes
- No metadata changes

### Exports

Exported from both `strategy/index.ts` and `src/index.ts`:

```typescript
export type { PromptAssemblyTrace } from './strategy'
export type { PromptAssemblyTraceBuilder } from './strategy'
export { DefaultPromptAssemblyTraceBuilder } from './strategy'
```

---

## Consequences

### Positive

1. **Unified trace model exists** — all prompt assembly artifacts are now captured in a single domain object
2. **Tool-ready** — debug tools can consume the trace without knowing individual metadata fields
3. **Foundation-only** — no consumption, no builder changes, no pipeline changes
4. **Pure, stateless, deterministic** — follows the same design principles as all inspectors
5. **Backward compatible** — no breaking changes to any component
6. **Minimal surface** — single interface, single builder interface, single default implementation

### Negative

None.

### Neutral

1. The builder is not yet consumed by `DefaultPromptBuilder` or `Pipeline`
2. Consumption and metadata storage can be added in a future work order

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All pass (zero modifications)
- **New tests**: `PromptAssemblyTraceFoundation.test.ts` with 90 test cases
- **No breaking changes** to any Public API
- **No prompt output changes**
- **No metadata changes**
- **No PromptBuilder / Pipeline / Runtime changes**

---

## References

- WO-S5-050 — Prompt Assembly Snapshot Foundation (ADR-0097)
- WO-S5-051 — Prompt Assembly Snapshot Consumption (ADR-0098)
- WO-S5-052 — Prompt Inspector Foundation (ADR-0099)
- WO-S5-053 — Prompt Inspector Consumption (ADR-0100)
- WO-S5-054 — Prompt Inspector Rendering Foundation (ADR-0101)
- WO-S5-055 — Prompt Inspector Rendering Consumption (ADR-0102)
- WO-S5-056 — Prompt Inspector Export Foundation (ADR-0103)
- WO-S5-057 — Prompt Inspector Export Consumption (ADR-0104)
- WO-S5-058 — This Work Order
- `packages/ai/src/strategy/PromptAssemblyTrace.ts`
- `packages/ai/src/strategy/PromptAssemblyTraceBuilder.ts`
- `packages/ai/src/strategy/DefaultPromptAssemblyTraceBuilder.ts`
- `packages/ai/src/__tests__/PromptAssemblyTraceFoundation.test.ts`