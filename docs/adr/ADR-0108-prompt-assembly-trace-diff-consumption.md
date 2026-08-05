# ADR-0108: Prompt Assembly Trace Diff Consumption

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-061  
**Architecture Version:** v0.95

---

## Context

The Prompt Assembly Trace Diff Foundation (WO-S5-060, ADR-0107) introduced `PromptAssemblyTraceDiff`, `PromptAssemblyTraceDiffer`, and `DefaultPromptAssemblyTraceDiffer` — but they were **not consumed** by `DefaultPromptBuilder`. The differ existed, yet no production code produced a `traceDiff` object.

### Problem

1. **No traceDiff produced** — the differ domain model existed but was never invoked
2. **No metadata field** — `metadata.promptAssembly.traceDiff` did not exist
3. **Foundation not consumable** — the differ was orphaned

---

## Decision

### BuilderOptions

Add an optional field:

```typescript
promptAssemblyTraceDiffer?: PromptAssemblyTraceDiffer
```

- Backward compatible — all existing fields unchanged
- Optional — omitting it produces no traceDiff

### DefaultPromptBuilder

Add a private field wired from `BuilderOptions`:

```typescript
private readonly promptAssemblyTraceDiffer?: PromptAssemblyTraceDiffer
```

Legacy constructor path wires it as `undefined`.

### New Phase — 0.95985

Inserted between Phase 0.9598 (PromptAssemblyTraceBuilder) and Phase 0.96 (PromptAssemblyStrategyResolver):

```text
Phase 0.9598
PromptAssemblyTraceBuilder
    ↓
trace
    ↓
PromptAssemblyTraceDiffer.diff({}, trace)  ← Phase 0.95985
    ↓
traceDiff
    ↓
Phase 0.96 (PromptAssemblyStrategyResolver)
```

The differ receives:
- **before**: empty trace `{}`
- **after**: the current trace from Phase 0.9598

This establishes the consumption pipeline. Future work may introduce previous-trace comparison.

Executed only when:
- `trace !== undefined` (trace builder produced a trace)
- `promptAssemblyTraceDiffer` exists

### Metadata

Stored only when both trace and differ are present:

```typescript
metadata.promptAssembly.traceDiff  // PromptAssemblyTraceDiff
```

### Coexistence

`traceDiff` is **additive** — it coexists with all existing fields:

- `trace`
- `snapshot`
- `inspector`
- `inspectorRendered`
- `inspectorExported`
- `plan`
- `optimizedPlan`
- `planDiff`
- `ranking`, `budget`, `selection`

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
- Prompt output — unchanged (metadata only, no prompt injection)

---

## Consequences

### Positive

1. **traceDiff produced** — the differ is now invoked by production code
2. **Additive** — all existing metadata fields preserved
3. **Backward compatible** — optional field, no breaking changes
4. **No prompt changes** — metadata only
5. **Consumption pipeline established** — future work can introduce previous-trace comparison

### Negative

None.

### Neutral

1. traceDiff is generated only when both the trace builder and differ are configured
2. Initial implementation compares against empty trace `{}` — all existing fields appear as added
3. Future work may compare against a previous trace for meaningful before/after diffs

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All pass (zero modifications)
- **New tests**: `PromptAssemblyTraceDiffConsumption.test.ts` with 56 test cases
- **No breaking changes** to any Public API
- **`traceDiff` stored** in `metadata.promptAssembly.traceDiff`
- **No prompt output changes** — verified by tests

---

## References

- WO-S5-058 — Prompt Assembly Trace Foundation (ADR-0105)
- WO-S5-059 — Prompt Assembly Trace Consumption (ADR-0106)
- WO-S5-060 — Prompt Assembly Trace Diff Foundation (ADR-0107)
- WO-S5-061 — This Work Order
- `packages/ai/src/prompt/BuilderOptions.ts`
- `packages/ai/src/prompt/DefaultPromptBuilder.ts`
- `packages/ai/src/__tests__/PromptAssemblyTraceDiffConsumption.test.ts`