# ADR-0073: Strategy Module Prompt Integration

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-026  
**Architecture Version:** v0.61

---

## Context

WO-S5-025 introduced the `StrategyModuleRenderer` and `DefaultStrategyModuleRenderer`, producing `strategyModuleRendered` which was stored in `metadata.promptAssembly.strategyModuleRendered`. However, this rendered content was **not** injected into the actual prompt — it existed only in metadata.

The Strategy Module guidelines are now ready to become a formal prompt section, following the same pattern used by IntentRenderer, EntityRenderer, SemanticContextRenderer, and PromptStrategyRenderer.

### Current Prompt Order

```
Intent → Entity → Semantic → Strategy → System → ...
```

### Problem

1. **No prompt injection** — `strategyModuleRendered` is in metadata but not in the prompt
2. **Missing PromptContext field** — `strategyModuleRendered` is not a recognized PromptContext key
3. **Inconsistent pattern** — all other rendered outputs (intent, entity, semantic, strategy) are prompt sections

---

## Decision

### PromptContext Extension

Added `strategyModuleRendered?: string` to `PromptContext`. Optional — no breaking changes.

### CANONICAL_ORDER Update

```
intentRendered
entityRendered
semanticRendered
strategyModuleRendered    ← NEW (position 3)
strategyRendered
system
userInput
memory
reflections
worldState
observations
```

Strategy Module must appear **before** Strategy in the rendered prompt.

### DefaultPromptCompression Update

Added `'strategyModuleRendered'` to `isPromptContextKey()` valid keys list.

### DefaultPromptBuilder Injection

After Phase 0.94 produces `strategyModuleRendered`:
1. Inject into `promptContext.strategyModuleRendered` (before compression)
2. Inject into `renderContext.strategyModuleRendered` (before rendering, with correct order)

### NOT Modified

- `Pipeline` — unchanged
- `Planner` — unchanged
- `Runtime` — unchanged
- `AgentLoop` — unchanged
- `PromptStrategy` — unchanged
- `StrategyModule` — unchanged
- `StrategyModuleRenderer` — unchanged
- `BuilderOptions` API — unchanged
- Metadata structure — unchanged

---

## Prompt Output Example

```
User Intent:

- Create

Entities:

- Tree

Semantic Context:

Intent:
- Create

Entities:
- Tree

Strategy Module:

Creation Guidelines:

- Prefer creating new entities
- Avoid modifying existing entities

Prompt Strategy:

- create

You are a game action planner...
```

---

## Consequences

### Positive

1. **Strategy Module is now a prompt section** — LLM receives strategy-specific guidelines
2. **Correct ordering** — Strategy Module appears before Strategy, after Semantic Context
3. **Consistent pattern** — mirrors Intent, Entity, Semantic, Strategy integration path
4. **Backward compatible** — optional field, no existing prompt behavior changed for non-module cases

### Negative

None.

### Neutral

1. Prompts with strategy modules will be slightly longer — future WOs may address budget impact
2. The canonical order is now: Intent → Entity → Semantic → Strategy Module → Strategy → System → ...

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All 2684 pass (2 test expectations updated from "prompt unchanged" to "prompt includes")
- **New tests**: `StrategyModulePromptIntegration.test.ts` with 26 comprehensive test cases
- **Total tests**: 2710 passing
- **Canonical order verified**: Intent → Entity → Semantic → Strategy Module → Strategy → System

---

## References

- WO-S5-025 — Strategy Module Rendering Foundation (ADR-0072)
- WO-S5-024 — Strategy Module Consumption (ADR-0071)
- WO-S5-018 — Prompt Strategy Prompt Integration (ADR-0065)
- `packages/ai/src/prompt/PromptContext.ts`
- `packages/ai/src/prompt/DefaultPromptRenderer.ts`
- `packages/ai/src/prompt/DefaultPromptCompression.ts`
- `packages/ai/src/prompt/DefaultPromptBuilder.ts`
