# ADR-0072: Strategy Module Rendering Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-025  
**Architecture Version:** v0.60

---

## Context

WO-S5-024 connected StrategyModule to PromptBuilder, storing raw module output as `metadata.promptAssembly.strategyModule`. However, there is no rendering layer for strategy module content — the raw guidelines text lacks a "Strategy Module:" header prefix that would make it suitable for prompt injection.

### Current Flow

```
Phase 0.925: StrategyModule resolution → strategyModule (raw string)
Phase 0.95:  PromptStrategyRenderer.render() → strategyRendered
```

### Problem

1. **No renderer** — StrategyModule content is stored as raw text, not formatted for prompt use
2. **No separation of concerns** — raw content and rendered form are conflated
3. **Inconsistent pattern** — every other layer (Intent, Entity, Semantic, Strategy) has a dedicated Renderer

---

## Decision

### StrategyModuleRenderer Interface

```typescript
export interface StrategyModuleRenderer {
  render(moduleContent: string): string
}
```

Takes raw `strategyModule` string, returns formatted `strategyModuleRendered` string.

### DefaultStrategyModuleRenderer

Prepends `"Strategy Module:\n\n"` header to raw content:

| Input | Output |
|-------|--------|
| `"Creation Guidelines:\n\n- Prefer creating new entities"` | `"Strategy Module:\n\nCreation Guidelines:\n\n- Prefer creating new entities"` |
| `""` | `""` |
| `null` / `undefined` | `""` |
| `"   "` (whitespace) | `""` |

### BuilderOptions Extension

Added `strategyModuleRenderer?: StrategyModuleRenderer` to BuilderOptions. Optional — no breaking changes.

### PromptBuilder Phase 0.94

Added between Phase 0.925 (module resolution) and Phase 0.95 (strategy rendering):

```
Phase 0.925: StrategyModule resolution       → strategyModule
Phase 0.94:  StrategyModuleRenderer.render()  → strategyModuleRendered
Phase 0.95:  PromptStrategyRenderer.render()   → strategyRendered
```

When `strategyModuleOutput` is defined, render it and store in `metadata.promptAssembly.strategyModuleRendered`. Falls back to `DefaultStrategyModuleRenderer` when no renderer is injected.

### Metadata Structure

```typescript
metadata.promptAssembly = {
  strategy: { name: 'create' },
  strategyRendered: 'Prompt Strategy:\n\n- create',
  strategyModule: 'Creation Guidelines:\n\n- Prefer creating new entities\n- Avoid modifying existing entities',
  strategyModuleRendered: 'Strategy Module:\n\nCreation Guidelines:\n\n- Prefer creating new entities\n- Avoid modifying existing entities',
  // ... other fields
}
```

When no module matches: `strategyModuleRendered` field is absent from metadata.

### NOT Modified

- `PromptContext` — unchanged
- `PromptRenderer` — unchanged
- `PromptCompression` — unchanged
- `Pipeline` — unchanged
- `Planner` — unchanged
- `Runtime` — unchanged
- `AgentLoop` — unchanged
- `StrategyModule` — unchanged
- `PromptStrategy` — unchanged
- `PromptStrategyRenderer` — unchanged

---

## Consequences

### Positive

1. **Rendering abstraction** — separates raw module content from formatted output
2. **Consistent pattern** — mirrors IntentRenderer, EntityRenderer, SemanticContextRenderer, PromptStrategyRenderer
3. **Pluggable** — custom StrategyModuleRenderer can be injected via BuilderOptions
4. **Prompt unchanged** — strategyModuleRendered goes to metadata only, not into the rendered prompt
5. **Backward compatible** — optional field, default fallback

### Negative

None.

### Neutral

1. `strategyModuleRendered` in metadata is a string — future WO may inject it into the prompt
2. Default renderer is simple header prefix — custom renderers may add formatting, truncation, etc.

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All 2645 pass (zero modifications)
- **New tests**: `StrategyModuleRenderingFoundation.test.ts` with 39 comprehensive test cases
- **Prompt unchanged**: Verified — prompt with/without strategyModuleRenderer is identical
- **No PromptContext changes**: Verified
- **No PromptRenderer changes**: Verified

---

## References

- WO-S5-024 — Strategy Module Consumption (ADR-0071)
- WO-S5-017 — Prompt Strategy Rendering Foundation (ADR-0064)
- `packages/ai/src/strategy/StrategyModuleRenderer.ts`
- `packages/ai/src/strategy/DefaultStrategyModuleRenderer.ts`
