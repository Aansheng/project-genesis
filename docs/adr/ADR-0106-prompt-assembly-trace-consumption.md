# ADR-0106: Prompt Assembly Trace Consumption

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-059  
**Architecture Version:** v0.93

---

## Context

The Prompt Assembly Trace Foundation (WO-S5-058, ADR-0105) introduced `PromptAssemblyTrace`, `PromptAssemblyTraceBuilder`, and `DefaultPromptAssemblyTraceBuilder` — but they were **not consumed** by `DefaultPromptBuilder`. The trace builder existed, yet no production code produced a `trace` object.

### Problem

1. **No trace produced** — the trace builder domain model existed but was never invoked
2. **No metadata field** — `metadata.promptAssembly.trace` did not exist
3. **Foundation not consumable** — the trace builder was orphaned

---

## Decision

### BuilderOptions

Add an optional field:

```typescript
promptAssemblyTraceBuilder?: PromptAssemblyTraceBuilder
```

- Backward compatible — all existing fields unchanged
- Optional — omitting it produces no trace

### DefaultPromptBuilder

Add a private field wired from `BuilderOptions`:

```typescript
private readonly promptAssemblyTraceBuilder?: PromptAssemblyTraceBuilder
```

Legacy constructor path wires it as `undefined`.

### New Phase — 0.9598

Inserted between Phase 0.9597 (PromptInspectorExporter) and Phase 0.96 (PromptAssemblyStrategyResolver):

```text
Phase 0.9597
PromptInspectorExporter
    ↓
inspectorExported
    ↓
PromptAssemblyTraceBuilder.build(metadata)  ← Phase 0.9598
    ↓
trace
    ↓
Phase 0.96 (PromptAssemblyStrategyResolver)
```

The trace builder receives the full promptAssembly metadata object constructed from all available phase variables (strategy, strategySelection, plan, optimizedPlan, planDiff, snapshot, inspector, inspectorRendered, inspectorExported).

Executed only when:
- `promptAssemblyTraceBuilder` exists

### Metadata

Stored only when the trace builder exists:

```typescript
metadata.promptAssembly.trace  // PromptAssemblyTrace
```

### Coexistence

`trace` is **additive** — it coexists with all existing fields:

- `strategy`
- `strategySelection`
- `strategyRendered`
- `plan`
- `optimizedPlan`
- `planDiff`
- `planRendered`
- `snapshot`
- `inspector`
- `inspectorRendered`
- `inspectorExported`
- `ranking`, `budget`, `selection`

Nothing is removed or modified.

### NOT Modified

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
- `PromptAssemblyTrace` — unchanged
- `PromptAssemblyTraceBuilder` — unchanged
- `DefaultPromptAssemblyTraceBuilder` — unchanged
- Prompt output — unchanged (metadata only, no prompt injection)

---

## Consequences

### Positive

1. **Trace produced** — the trace builder is now invoked by production code
2. **Additive** — all existing metadata fields preserved
3. **Backward compatible** — optional field, no breaking changes
4. **No prompt changes** — metadata only
5. **Unified trace** — consumers access the complete prompt assembly lifecycle via a single `trace` field

### Negative

None.

### Neutral

1. Trace is generated only when the trace builder is configured
2. Trace reflects all data available from the preceding phases (0.958 through 0.9597)

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All pass (zero modifications)
- **New tests**: `PromptAssemblyTraceConsumption.test.ts` with 54 test cases
- **No breaking changes** to any Public API
- **`trace` stored** in `metadata.promptAssembly.trace`
- **No prompt output changes** — verified by tests

---

## References

- WO-S5-050 — Prompt Assembly Snapshot Foundation (ADR-0097)
- WO-S5-052 — Prompt Inspector Foundation (ADR-0099)
- WO-S5-054 — Prompt Inspector Rendering Foundation (ADR-0101)
- WO-S5-056 — Prompt Inspector Export Foundation (ADR-0103)
- WO-S5-058 — Prompt Assembly Trace Foundation (ADR-0105)
- WO-S5-059 — This Work Order
- `packages/ai/src/prompt/BuilderOptions.ts`
- `packages/ai/src/prompt/DefaultPromptBuilder.ts`
- `packages/ai/src/__tests__/PromptAssemblyTraceConsumption.test.ts`