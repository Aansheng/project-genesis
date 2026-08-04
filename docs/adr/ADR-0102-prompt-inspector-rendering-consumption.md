# ADR-0102: Prompt Inspector Rendering Consumption

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-055  
**Architecture Version:** v0.89

---

## Context

The Prompt Inspector Renderer Foundation (WO-S5-054, ADR-0101) introduced `PromptInspectorRenderer` and `DefaultPromptInspectorRenderer` — but they were **not consumed** by `DefaultPromptBuilder`. The renderer existed, yet no production code produced an `inspectorRendered` string.

### Problem

1. **No rendering produced** — the renderer domain model existed but was never invoked
2. **No metadata field** — `metadata.promptAssembly.inspectorRendered` did not exist
3. **Foundation not consumable** — the renderer was orphaned

---

## Decision

### BuilderOptions

Add an optional field:

```typescript
promptInspectorRenderer?: PromptInspectorRenderer
```

- Backward compatible — all existing fields unchanged
- Optional — omitting it produces no inspector rendering

### DefaultPromptBuilder

Add a private field wired from `BuilderOptions`:

```typescript
private readonly promptInspectorRenderer?: PromptInspectorRenderer
```

Legacy constructor path wires it as `undefined`.

### New Phase — 0.9595

Inserted between Phase 0.959 (PromptInspectorBuilder) and Phase 0.96 (PromptAssemblyStrategyResolver):

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
Phase 0.96 (PromptAssemblyStrategyResolver)
```

Executed only when:
- `promptInspector` exists (from Phase 0.959)
- `promptInspectorRenderer` exists

### Metadata

Stored only when the renderer exists:

```typescript
metadata.promptAssembly.inspectorRendered  // string
```

### Coexistence

`inspectorRendered` is **additive** — it coexists with all existing fields:

- `inspector`
- `snapshot`
- `plan`
- `optimizedPlan`
- `planDiff`
- `planRendered`
- `strategy`
- `strategyRendered`
- `ranking`, `budget`, `selection`

Nothing is removed or modified.

### NOT Modified

- `PromptRenderer` — unchanged
- `PromptCompression` — unchanged
- `Planner` — unchanged
- `Runtime` — unchanged
- `AgentLoop` — unchanged
- `PromptInspector` — unchanged
- `PromptInspectorBuilder` — unchanged
- `PromptInspectorRenderer` — unchanged
- Prompt output — unchanged (metadata only, no prompt injection)

---

## Consequences

### Positive

1. **Rendering produced** — the renderer is now invoked by production code
2. **Additive** — all existing metadata fields preserved
3. **Backward compatible** — optional field, no breaking changes
4. **No prompt changes** — metadata only
5. **Inspector-dependent** — rendering requires inspector from Phase 0.959

### Negative

None.

### Neutral

1. Rendering is generated only when both inspector and renderer are configured
2. Rendering reflects only data available in the inspector from Phase 0.959

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All pass (zero modifications)
- **New tests**: `PromptInspectorRenderingConsumption.test.ts` with 46 test cases
- **Total tests**: 4278 passing
- **No breaking changes** to any Public API
- **`inspectorRendered` stored** in `metadata.promptAssembly.inspectorRendered`
- **No prompt output changes** — verified by tests

---

## References

- WO-S5-052 — Prompt Inspector Foundation (ADR-0099)
- WO-S5-053 — Prompt Inspector Consumption (ADR-0100)
- WO-S5-054 — Prompt Inspector Rendering Foundation (ADR-0101)
- WO-S5-055 — This Work Order
- `packages/ai/src/prompt/BuilderOptions.ts`
- `packages/ai/src/prompt/DefaultPromptBuilder.ts`
- `packages/ai/src/__tests__/PromptInspectorRenderingConsumption.test.ts`