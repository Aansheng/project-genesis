# ADR-0104: Prompt Inspector Export Consumption

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-057  
**Architecture Version:** v0.91

---

## Context

The Prompt Inspector Export Foundation (WO-S5-056, ADR-0103) introduced `PromptInspectorExporter` and `DefaultPromptInspectorExporter` — but they were **not consumed** by `DefaultPromptBuilder`. The exporter existed, yet no production code produced an `inspectorExported` string.

### Problem

1. **No export produced** — the exporter domain model existed but was never invoked
2. **No metadata field** — `metadata.promptAssembly.inspectorExported` did not exist
3. **Foundation not consumable** — the exporter was orphaned

---

## Decision

### BuilderOptions

Add an optional field:

```typescript
promptInspectorExporter?: PromptInspectorExporter
```

- Backward compatible — all existing fields unchanged
- Optional — omitting it produces no inspector export

### DefaultPromptBuilder

Add a private field wired from `BuilderOptions`:

```typescript
private readonly promptInspectorExporter?: PromptInspectorExporter
```

Legacy constructor path wires it as `undefined`.

### New Phase — 0.9597

Inserted between Phase 0.9595 (PromptInspectorRenderer) and Phase 0.96 (PromptAssemblyStrategyResolver):

```text
Phase 0.959
PromptInspectorBuilder
    ↓
inspector
    ↓
PromptInspectorRenderer.render(inspector)  ← Phase 0.9595
    ↓
inspectorRendered
    ↓
PromptInspectorExporter.export(inspector)  ← Phase 0.9597
    ↓
inspectorExported
    ↓
Phase 0.96 (PromptAssemblyStrategyResolver)
```

Executed only when:
- `promptInspector` exists (from Phase 0.959)
- `promptInspectorExporter` exists

### Metadata

Stored only when the exporter exists:

```typescript
metadata.promptAssembly.inspectorExported  // string
```

### Coexistence

`inspectorExported` is **additive** — it coexists with all existing fields:

- `inspector`
- `inspectorRendered`
- `snapshot`
- `plan`
- `optimizedPlan`
- `planDiff`
- `planRendered`
- `strategy`
- `strategyRendered`
- `strategySelection`
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
- Prompt output — unchanged (metadata only, no prompt injection)

---

## Consequences

### Positive

1. **Export produced** — the exporter is now invoked by production code
2. **Additive** — all existing metadata fields preserved
3. **Backward compatible** — optional field, no breaking changes
4. **No prompt changes** — metadata only
5. **Inspector-dependent** — export requires inspector from Phase 0.959
6. **Tool-ready** — Studio tools (Debug Panel, Timeline, Diff Viewer, Strategy Inspector) can now consume `inspectorExported` from real prompt assembly runs

### Negative

None.

### Neutral

1. Export is generated only when both inspector and exporter are configured
2. Export reflects only data available in the inspector from Phase 0.959

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All pass (zero modifications)
- **New tests**: `PromptInspectorExportConsumption.test.ts` with 50 test cases
- **No breaking changes** to any Public API
- **`inspectorExported` stored** in `metadata.promptAssembly.inspectorExported`
- **No prompt output changes** — verified by tests

---

## References

- WO-S5-052 — Prompt Inspector Foundation (ADR-0099)
- WO-S5-053 — Prompt Inspector Consumption (ADR-0100)
- WO-S5-054 — Prompt Inspector Rendering Foundation (ADR-0101)
- WO-S5-055 — Prompt Inspector Rendering Consumption (ADR-0102)
- WO-S5-056 — Prompt Inspector Export Foundation (ADR-0103)
- WO-S5-057 — This Work Order
- `packages/ai/src/prompt/BuilderOptions.ts`
- `packages/ai/src/prompt/DefaultPromptBuilder.ts`
- `packages/ai/src/__tests__/PromptInspectorExportConsumption.test.ts`
