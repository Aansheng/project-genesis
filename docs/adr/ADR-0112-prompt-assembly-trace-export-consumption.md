# ADR-0112: Prompt Assembly Trace Export Consumption

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-065  
**Architecture Version:** v0.99

---

## Context

The Prompt Assembly Trace Export Foundation (WO-S5-064, ADR-0111) introduced `PromptAssemblyTraceExporter` and `DefaultPromptAssemblyTraceExporter` — but they were **not consumed** by `DefaultPromptBuilder`. The exporter existed, yet no production code produced a `traceExported` string.

### Problem

1. **No traceExported produced** — the exporter domain model existed but was never invoked
2. **No metadata field** — `metadata.promptAssembly.traceExported` did not exist
3. **Foundation not consumable** — the exporter was orphaned

---

## Decision

### BuilderOptions

Add an optional field:

```typescript
promptAssemblyTraceExporter?: PromptAssemblyTraceExporter
```

- Backward compatible — all existing fields unchanged
- Optional — omitting it produces no traceExported

### DefaultPromptBuilder

Add a private field wired from `BuilderOptions`:

```typescript
private readonly promptAssemblyTraceExporter?: PromptAssemblyTraceExporter
```

Legacy constructor path wires it as `undefined`.

### New Phase — 0.95995

Inserted between Phase 0.9599 (PromptAssemblyTraceRenderer) and Phase 0.96 (PromptAssemblyStrategyResolver):

```text
Phase 0.9598
PromptAssemblyTraceBuilder
    ↓
trace
    ↓
Phase 0.95985
PromptAssemblyTraceDiffer
    ↓
traceDiff
    ↓
Phase 0.9599
PromptAssemblyTraceRenderer
    ↓
traceRendered
    ↓
Phase 0.95995
PromptAssemblyTraceExporter.export(trace)
    ↓
traceExported
    ↓
Phase 0.96 (PromptAssemblyStrategyResolver)
```

The exporter receives the current trace from Phase 0.9598.

Executed only when:
- `trace !== undefined` (trace builder produced a trace)
- `promptAssemblyTraceExporter` exists

### Metadata

Stored only when both trace and exporter are present and exported string is non-empty:

```typescript
metadata.promptAssembly.traceExported  // string
```

### Coexistence

`traceExported` is **additive** — it coexists with all existing fields including `trace`, `traceDiff`, `traceRendered`, `snapshot`, `inspector`, `inspectorRendered`, `inspectorExported`, `plan`, `optimizedPlan`, `planDiff`, `strategy`, and `strategySelection`.

Nothing is removed or modified.

### NOT Modified

- `PromptRenderer` — unchanged
- `PromptCompression` — unchanged
- `Planner` — unchanged
- `Runtime` — unchanged
- `AgentLoop` — unchanged
- `Pipeline` — unchanged
- `PromptAssemblyTrace` — unchanged
- `PromptAssemblyTraceBuilder` — unchanged
- `PromptAssemblyTraceDiffer` — unchanged
- `PromptAssemblyTraceRenderer` — unchanged
- `PromptAssemblyTraceExporter` — unchanged
- Prompt output — unchanged (metadata only, no prompt injection)

---

## Consequences

### Positive

1. **traceExported produced** — the exporter is now invoked by production code
2. **Additive** — all existing metadata fields preserved
3. **Backward compatible** — optional field, no breaking changes
4. **No prompt changes** — metadata only
5. **Complete trace pipeline** — trace → traceDiff → traceRendered → traceExported all now consumed

### Negative

None.

### Neutral

1. traceExported is generated only when both the trace builder and exporter are configured
2. Empty string from exporter is not stored (guarded by `length > 0` check)
3. JSON output is identical to `JSON.stringify(trace, null, 2)`

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All pass (zero modifications)
- **New tests**: `PromptAssemblyTraceExportConsumption.test.ts` with 55 test cases
  - BuilderOptions (4 tests)
  - Exporter invocation (5 tests)
  - Metadata creation (5 tests)
  - Metadata coexistence (12 tests)
  - Deterministic (3 tests)
  - Stateless (1 test)
  - Pure (3 tests)
  - Legacy constructor (3 tests)
  - No prompt changes (5 tests)
  - Trace dependency (5 tests)
  - Custom exporter (3 tests)
  - Exports (2 tests)
  - Compatibility (4 tests)
- **No breaking changes** to any Public API
- **`traceExported` stored** in `metadata.promptAssembly.traceExported`
- **No prompt output changes** — verified by tests

---

## References

- WO-S5-058 — Prompt Assembly Trace Foundation (ADR-0105)
- WO-S5-059 — Prompt Assembly Trace Consumption (ADR-0106)
- WO-S5-060 — Prompt Assembly Trace Diff Foundation (ADR-0107)
- WO-S5-061 — Prompt Assembly Trace Diff Consumption (ADR-0108)
- WO-S5-062 — Prompt Assembly Trace Rendering Foundation (ADR-0109)
- WO-S5-063 — Prompt Assembly Trace Renderer Consumption (ADR-0110)
- WO-S5-064 — Prompt Assembly Trace Export Foundation (ADR-0111)
- WO-S5-065 — This Work Order
- `packages/ai/src/prompt/BuilderOptions.ts`
- `packages/ai/src/prompt/DefaultPromptBuilder.ts`
- `packages/ai/src/__tests__/PromptAssemblyTraceExportConsumption.test.ts`