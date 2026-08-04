# ADR-0101: Prompt Inspector Rendering Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-054  
**Architecture Version:** v0.88

---

## Context

The Prompt Inspector domain model exists (ADR-0099, ADR-0100) with `PromptInspector`, `PromptInspectorSection`, `PromptInspectorBuilder`, and `DefaultPromptInspectorBuilder`. However, there is **no way to render the inspector into a human-readable report**.

### Problem

1. **No renderer exists** — the inspector domain model can be built but not rendered
2. **No human-readable output** — consumers that want to display the inspector have no standard format
3. **Foundation incomplete** — the rendering layer is missing from the inspector pipeline

---

## Decision

### New Interface

Create `PromptInspectorRenderer` in `packages/ai/src/strategy/PromptInspectorRenderer.ts`:

```typescript
export interface PromptInspectorRenderer {
  render(inspector: PromptInspector): string
}
```

- Single method: accepts `PromptInspector` → returns `string`
- Pure: same inspector always produces same output
- Stateless: no state between calls
- Deterministic: no randomness

### Default Implementation

Create `DefaultPromptInspectorRenderer` in `packages/ai/src/strategy/DefaultPromptInspectorRenderer.ts`:

```text
Prompt Inspector

Strategy:
create

Sections:

- Rendered Strategy
- Strategy Selection
- Strategy Module
- Prompt Plan
- Optimized Plan
- Plan Diff
- Rendered Plan
```

**Rendering Rules:**

1. **Strategy block** — included only when `inspector.strategy` is defined:
   ```text
   Strategy:
   <value>
   ```

2. **No sections** — when `inspector.sections.length === 0`, output:
   ```text
   Prompt Inspector

   No Sections
   ```

3. **Sections list** — rendered as a bullet list preserving inspector section order:
   ```text
   Sections:

   - Section Title 1
   - Section Title 2
   ```

### NOT Modified

- `PromptInspector` — unchanged
- `PromptInspectorBuilder` — unchanged
- `DefaultPromptInspectorBuilder` — unchanged
- `DefaultPromptBuilder` — unchanged
- `BuilderOptions` — unchanged
- `PromptRenderer` — unchanged
- `PromptCompression` — unchanged
- `Planner` — unchanged
- `Runtime` — unchanged
- `AgentLoop` — unchanged
- No prompt output changes
- No metadata changes

### Exports

Exported from both `strategy/index.ts` and `src/index.ts`:

```typescript
export type { PromptInspectorRenderer } from './strategy'
export { DefaultPromptInspectorRenderer } from './strategy'
```

---

## Consequences

### Positive

1. **Renderer exists** — the inspector can now be rendered to human-readable text
2. **Foundation-only** — no consumption, no builder changes, no metadata changes
3. **Pure, stateless, deterministic** — follows the same design principles as all inspectors
4. **Backward compatible** — no breaking changes to any component
5. **Minimal surface** — single method, single default implementation

### Negative

None.

### Neutral

1. Section content (the `unknown` typed field) is not included in the rendered output
2. Content rendering can be added in a future iteration as consumption demands

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All pass (zero modifications)
- **New tests**: `PromptInspectorRenderingFoundation.test.ts` with 74 test cases
- **No breaking changes** to any Public API
- **No prompt output changes**
- **No metadata changes**

---

## References

- WO-S5-052 — Prompt Inspector Foundation (ADR-0099)
- WO-S5-053 — Prompt Inspector Consumption (ADR-0100)
- WO-S5-054 — This Work Order
- `packages/ai/src/strategy/PromptInspectorRenderer.ts`
- `packages/ai/src/strategy/DefaultPromptInspectorRenderer.ts`
- `packages/ai/src/__tests__/PromptInspectorRenderingFoundation.test.ts`