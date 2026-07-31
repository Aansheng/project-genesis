# ADR-0071: Strategy Module Consumption

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-024  
**Architecture Version:** v0.59

---

## Context

WO-S5-023 introduced the `StrategyModule` interface and four concrete implementations (CreateStrategyModule, QueryStrategyModule, ModifyStrategyModule, DeleteStrategyModule). Each module produces deterministic guideline text for its strategy.

However, these modules are not consumed by the PromptBuilder — they exist in isolation.

### Current Flow

```
Phase 0.9:  PromptStrategySelector.select() → selectedStrategy
Phase 0.95: PromptStrategyRenderer.render()  → strategyRendered
Phase 1:    MemoryRanking.rank()
```

### Problem

1. **No wiring** — StrategyModules are not connected to PromptBuilder
2. **No metadata** — StrategyModule output is not stored in `metadata.promptAssembly`
3. **No resolution** — No mechanism to match a StrategyModule to the selected strategy

---

## Decision

### StrategyModule Resolution (Phase 0.925)

Added Phase 0.925 between strategy selection (0.9) and strategy rendering (0.95):

```
Phase 0.9:   PromptStrategySelector.select() → selectedStrategy
Phase 0.925: StrategyModule resolution        → strategyModule (string)
Phase 0.95:  PromptStrategyRenderer.render()  → strategyRendered
Phase 1:    MemoryRanking.rank()
```

### Resolution Rule

Iterate `strategyModules` list, find module where `module.name === selectedStrategy.name`, call `module.build(context)`, store result string in `metadata.promptAssembly.strategyModule`.

If no module matches: skip — do not write the field to metadata.

### StrategyModule `name` Property

Added `readonly name: string` to `StrategyModule` interface. Each module's name matches its corresponding `PromptStrategy.name`:

| Module | name |
|--------|------|
| CreateStrategyModule | `'create'` |
| QueryStrategyModule | `'query'` |
| ModifyStrategyModule | `'modify'` |
| DeleteStrategyModule | `'delete'` |

### BuilderOptions Extension

Added `strategyModules?: readonly StrategyModule[]` to `BuilderOptions`. Optional — no breaking changes.

### Metadata Structure

```typescript
metadata.promptAssembly = {
  strategy: { name: 'create' },
  strategyRendered: 'Prompt Strategy:\n\n- create',
  strategyModule: 'Creation Guidelines:\n\n- Prefer creating new entities\n- Avoid modifying existing entities',
  // ... other fields
}
```

When no module matches: `strategyModule` field is absent from metadata.

### NOT Modified

- `PromptContext` — unchanged
- `PromptRenderer` — unchanged
- `PromptCompression` — unchanged
- `Pipeline` — unchanged
- `Planner` — unchanged
- `PromptStrategy` — unchanged
- `PromptStrategyRenderer` — unchanged
- `StrategyModule` — only extended with `name` property (non-breaking)

---

## Consequences

### Positive

1. **StrategyModule integrated** — PromptBuilder now resolves and stores strategy-specific content
2. **Metadata enrichment** — `strategyModule` field available for downstream consumers
3. **Resolution rule is simple** — `module.name === strategy.name` is O(n) and deterministic
4. **No prompt changes** — strategyModule goes to metadata only, not into the rendered prompt
5. **Backward compatible** — all existing constructor forms and behavior preserved

### Negative

None.

### Neutral

1. `strategyModule` in metadata is a string — future WOs may need structured access
2. Prompt does not include strategyModule text yet — a future WO will decide when/how to inject it

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: All 2604 pass (zero modifications)
- **New tests**: `StrategyModuleConsumption.test.ts` with 41 comprehensive test cases
- **Prompt unchanged**: Verified — prompt with/without strategyModules is identical
- **No PromptContext changes**: Verified
- **No PromptRenderer changes**: Verified

---

## References

- WO-S5-023 — Strategy Module Foundation (ADR-0070)
- WO-S5-016 — Prompt Strategy Consumption (ADR-0063)
- WO-S5-017 — Prompt Strategy Rendering Foundation (ADR-0064)
- `packages/ai/src/prompt/DefaultPromptBuilder.ts`
- `packages/ai/src/prompt/BuilderOptions.ts`
- `packages/ai/src/strategy/StrategyModule.ts`
