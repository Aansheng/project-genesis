# ADR-0103: Prompt Inspector Export Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-056  
**Architecture Version:** v0.90

---

## Context

The Prompt Inspector stack (ADR-0099 through ADR-0102) provides `PromptAssemblySnapshot`, `PromptInspector`, `PromptInspectorBuilder`, and `PromptInspectorRenderer` — allowing Prompt Assembly Metadata to be converted into a structured debug object and rendered as human-readable text.

However, there is **no export layer**. Future Studio capabilities need stable, machine-readable output:

- **Prompt Debug Panel**
- **Prompt Timeline**
- **Prompt Diff Viewer**
- **Strategy Inspector**

Each of these will consume Prompt Inspector data in an external, stable format.

### Problem

1. **No export abstraction** — no unified `Inspector → External Representation` interface
2. **No JSON output** — the inspector cannot be serialized for tooling
3. **Foundation incomplete** — the export layer is missing

---

## Decision

### New Interface

Create `PromptInspectorExporter` in `packages/ai/src/strategy/PromptInspectorExporter.ts`:

```typescript
export interface PromptInspectorExporter {
  export(inspector: PromptInspector): string
}
```

- Single method: accepts `PromptInspector` → returns `string`
- Pure: same inspector always produces same output
- Stateless: no state between calls
- Deterministic: no randomness

### Default Implementation

Create `DefaultPromptInspectorExporter` in `packages/ai/src/strategy/DefaultPromptInspectorExporter.ts`:

```typescript
export class DefaultPromptInspectorExporter implements PromptInspectorExporter {
  export(inspector: PromptInspector): string {
    return JSON.stringify(inspector, null, 2)
  }
}
```

- Pretty-printed JSON (2-space indent)
- Preserves strategy + sections structure
- Deterministic, stateless, pure, immutable

### NOT Modified

- `PromptInspector` — unchanged
- `PromptInspectorBuilder` — unchanged
- `PromptInspectorRenderer` — unchanged
- `DefaultPromptBuilder` — unchanged
- `BuilderOptions` — unchanged
- `PromptRenderer` — unchanged
- `PromptCompression` — unchanged
- `Planner` — unchanged
- `Runtime` — unchanged
- `AgentLoop` — unchanged
- `Pipeline` — unchanged
- No prompt output changes
- No metadata changes

### Exports

Exported from both `strategy/index.ts` and `src/index.ts`:

```typescript
export type { PromptInspectorExporter } from './strategy'
export { DefaultPromptInspectorExporter } from './strategy'
```

---

## Consequences

### Positive

1. **Export layer exists** — the inspector can now be exported to stable JSON
2. **Tool-ready** — Studio tools (Debug Panel, Timeline, Diff Viewer, Strategy Inspector) can consume the output
3. **Foundation-only** — no consumption, no builder changes, no pipeline changes
4. **Pure, stateless, deterministic** — follows the same design principles as all inspectors
5. **Backward compatible** — no breaking changes to any component
6. **Minimal surface** — single method, single default implementation

### Negative

None.

### Neutral

1. The exporter is not yet consumed by `DefaultPromptBuilder` or `Pipeline`
2. Consumption and metadata storage (`inspectorExported`) can be added in a future work order

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All pass (zero modifications)
- **New tests**: `PromptInspectorExportFoundation.test.ts` with 75 test cases
- **No breaking changes** to any Public API
- **No prompt output changes**
- **No metadata changes**
- **No PromptBuilder / Pipeline / Runtime changes**

---

## References

- WO-S5-052 — Prompt Inspector Foundation (ADR-0099)
- WO-S5-053 — Prompt Inspector Consumption (ADR-0100)
- WO-S5-054 — Prompt Inspector Rendering Foundation (ADR-0101)
- WO-S5-055 — Prompt Inspector Rendering Consumption (ADR-0102)
- WO-S5-056 — This Work Order
- `packages/ai/src/strategy/PromptInspectorExporter.ts`
- `packages/ai/src/strategy/DefaultPromptInspectorExporter.ts`
- `packages/ai/src/__tests__/PromptInspectorExportFoundation.test.ts`