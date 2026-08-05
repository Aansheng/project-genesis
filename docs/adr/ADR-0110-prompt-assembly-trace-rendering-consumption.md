# ADR-0110: Prompt Assembly Trace Renderer Consumption

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-063  
**Architecture Version:** v0.97

---

## Context

The Prompt Assembly Trace Rendering Foundation (WO-S5-062, ADR-0109) introduced `PromptAssemblyTraceRenderer` and `DefaultPromptAssemblyTraceRenderer` — but they were **not consumed** by `DefaultPromptBuilder`. The renderer existed, yet no production code produced a `traceRendered` string.

### Problem

1. **No traceRendered produced** — the renderer domain model existed but was never invoked
2. **No metadata field** — `metadata.promptAssembly.traceRendered` did not exist
3. **Foundation not consumable** — the renderer was orphaned

---

## Decision

### BuilderOptions

Add an optional field:

```typescript
promptAssemblyTraceRenderer?: PromptAssemblyTraceRenderer
```

- Backward compatible — all existing fields unchanged
- Optional — omitting it produces no traceRendered

### DefaultPromptBuilder

Add a private field wired from `BuilderOptions`:

```typescript
private readonly promptAssemblyTraceRenderer?: PromptAssemblyTraceRenderer
```

Legacy constructor path wires it as `undefined`.

### New Phase — 0.9599

Inserted between Phase 0.95985 (PromptAssemblyTraceDiffer) and Phase 0.96 (PromptAssemblyStrategyResolver):

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
PromptAssemblyTraceRenderer.render(trace)
    ↓
traceRendered
    ↓
Phase 0.96 (PromptAssemblyStrategyResolver)
```

The renderer receives the current trace from Phase 0.9598.

Executed only when:
- `trace !== undefined` (trace builder produced a trace)
- `promptAssemblyTraceRenderer` exists

### Metadata

Stored only when both trace and renderer are present and rendered string is non-empty:

```typescript
metadata.promptAssembly.traceRendered  // string
```

### Coexistence

`traceRendered` is **additive** — it coexists with all existing fields including `trace`, `traceDiff`, `snapshot`, `inspector`, `inspectorRendered`, `inspectorExported`, `plan`, `optimizedPlan`, `planDiff`, `strategy`, and `strategySelection`.

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
- `DefaultPromptAssemblyTraceDiffer` — unchanged
- `PromptAssemblyTraceRenderer` — unchanged
- `DefaultPromptAssemblyTraceRenderer` — unchanged
- Prompt output — unchanged (metadata only, no prompt injection)

---

## Consequences

### Positive

1. **traceRendered produced** — the renderer is now invoked by production code
2. **Additive** — all existing metadata fields preserved
3. **Backward compatible** — optional field, no breaking changes
4. **No prompt changes** — metadata only
5. **Complete trace pipeline** — trace → traceDiff → traceRendered all now consumed

### Negative

None.

### Neutral

1. traceRendered is generated only when both the trace builder and renderer are configured
2. Empty string from renderer is not stored (guarded by `length > 0` check)
3. traceRendered stored alongside traceDiff in the metadata

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All pass (zero modifications)
- **New tests**: `PromptAssemblyTraceRenderingConsumption.test.ts` with 55 test cases
  - BuilderOptions (4 tests)
  - Renderer invocation (5 tests)
  - Metadata creation (5 tests)
  - Metadata coexistence (11 tests)
  - Deterministic (3 tests)
  - Stateless (1 test)
  - Pure (2 tests)
  - Legacy constructor (3 tests)
  - No prompt changes (5 tests)
  - Trace dependency (5 tests)
  - Custom renderer (4 tests)
  - Exports (3 tests)
  - Compatibility (4 tests)
- **No breaking changes** to any Public API
- **`traceRendered` stored** in `metadata.promptAssembly.traceRendered`
- **No prompt output changes** — verified by tests

---

## References

- WO-S5-058 — Prompt Assembly Trace Foundation (ADR-0105)
- WO-S5-059 — Prompt Assembly Trace Consumption (ADR-0106)
- WO-S5-060 — Prompt Assembly Trace Diff Foundation (ADR-0107)
- WO-S5-061 — Prompt Assembly Trace Diff Consumption (ADR-0108)
- WO-S5-062 — Prompt Assembly Trace Rendering Foundation (ADR-0109)
- WO-S5-063 — This Work Order
- `packages/ai/src/prompt/BuilderOptions.ts`
- `packages/ai/src/prompt/DefaultPromptBuilder.ts`
- `packages/ai/src/__tests__/PromptAssemblyTraceRenderingConsumption.test.ts`