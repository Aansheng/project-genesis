# ADR-0064: Prompt Strategy Rendering Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-017  
**Architecture Version:** v0.52

---

## Context

WO-S5-015 established the Strategy Layer with `PromptStrategy` abstraction. WO-S5-016 integrated strategy selection into the Prompt Builder pipeline as Phase 0.9, storing the selected strategy name in metadata.

However, there is no rendering abstraction for the selected strategy. While `IntentRenderer`, `EntityRenderer`, and `SemanticContextRenderer` all exist as formal interfaces with default implementations, the Strategy Layer lacks this capability. Selected strategy information exists only as a raw `{ name }` object — there is no mechanism to produce a human-readable representation.

### Problem

1. **No rendering abstraction** — `IntentRenderer`, `EntityRenderer`, `SemanticContextRenderer` all exist; `PromptStrategyRenderer` does not
2. **No human-readable output** — Strategy is only available as `{ name: "default" }` in metadata
3. **No extension point** — Custom strategy rendering formats cannot be injected
4. **Incomplete Strategy Layer** — The Strategy Layer has interface, default, selector, and consumption — but no rendering

### Constraints

1. **No PromptContext changes** — strategyRendered is metadata-only, never in PromptContext
2. **No prompt rendering changes** — strategyRendered does not appear in the final prompt string
3. **No PromptRenderer changes** — PromptRenderer interface, DefaultPromptRenderer untouched
4. **No Pipeline changes**
5. **No Planner changes**
6. **No breaking changes** — All existing tests pass with zero modifications
7. **Additive only** — New interfaces, new classes, new BuilderOptions field

---

## Decision

### PromptStrategyRenderer Interface

```typescript
interface PromptStrategyRenderer {
  render(strategy: PromptStrategy): string
}
```

- `render()` — Pure function that converts a PromptStrategy to a human-readable string
- No methods beyond the contract — pure interface
- No dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline

### DefaultPromptStrategyRenderer

```typescript
class DefaultPromptStrategyRenderer implements PromptStrategyRenderer {
  render(strategy: PromptStrategy): string {
    if (strategy === undefined || strategy === null) return ''
    const name = strategy.name
    if (name === undefined || name === null || name.trim().length === 0) return ''
    return `Prompt Strategy:\n\n- ${name}`
  }
}
```

- Default strategy → `"Prompt Strategy:\n\n- default"`
- Custom strategy → `"Prompt Strategy:\n\n- {name}"`
- Empty/blank/undefined/null → `""`
- Pure, stateless, deterministic — no side effects

### BuilderOptions Extension

```typescript
interface BuilderOptions {
  // ... existing fields ...
  strategyRenderer?: PromptStrategyRenderer  // ← NEW
}
```

`strategyRenderer` is optional — backward compatible. When absent, `DefaultPromptStrategyRenderer` is used (mirroring how other renderers work).

### Phase 0.95: Strategy Rendering

Inserted after Phase 0.9 (strategy selection) and before Phase 1 (MemoryRanking):

```
Phase 0.9:  PromptStrategySelector.select(strategies, context) → selectedStrategy
    ↓
Phase 0.95: PromptStrategyRenderer.render(selectedStrategy) → strategyRendered
    ↓             → metadata.promptAssembly.strategyRendered
Phase 1:    MemoryRanking.rank()
```

Rendering logic:

```typescript
const strategyRenderer = this.strategyRenderer ?? new DefaultPromptStrategyRenderer()
const strategyRendered: string | undefined = strategyRenderer.render(selectedStrategy)
```

### Metadata Storage

```typescript
{
  promptAssembly: {
    strategy: { name: "default" },
    strategyRendered: "Prompt Strategy:\n\n- default",
    // ... other assembly results ...
  }
}
```

`strategyRendered` is only added to metadata when the rendered string is non-empty.

### No PromptContext Injection

`strategyRendered` is NOT added to `PromptContext`. This ensures:
- No rendering changes needed
- No compression changes needed
- No pipeline changes needed
- No changes to CANONICAL_ORDER or compression key filtering

### Complete Phase Flow

```
Phase 0:   IntentAnalyzer.analyze()          → metadata.promptAssembly.intent
Phase 0.5: IntentRenderer.render()           → metadata.promptAssembly.intentRendered
Phase 0.75: EntityAnalyzer.analyze()         → metadata.promptAssembly.entity
Phase 0.875: EntityRenderer.render()         → metadata.promptAssembly.entityRendered
Phase 0.8:  SemanticContextBuilder.build()   → metadata.promptAssembly.semantic
Phase 0.85: SemanticContextRenderer.render() → metadata.promptAssembly.semanticRendered
Phase 0.9:  StrategySelector.select()        → metadata.promptAssembly.strategy
Phase 0.95: StrategyRenderer.render()        → metadata.promptAssembly.strategyRendered  ← NEW
Phase 1:    MemoryRanking.rank()             → metadata.promptAssembly.ranking
Phase 2:    PromptBudget.calculate()         → metadata.promptAssembly.budget
Phase 2.5:  ProviderBudget.getBudget()       → metadata.promptAssembly.providerBudget
Phase 3:    PromptSelection.select()         → metadata.promptAssembly.selection
Phase 4:    PromptCompression.compress()
Phase 6:    PromptRenderer.render()          → prompt string
```

---

## Consequences

### Positive

1. **Rendering abstraction complete** — All Sprint 5 semantic layers now have full interface + default + rendering
2. **Human-readable strategy output** — Strategy information is now available in human-readable form
3. **Extension point** — Custom strategy renderers can be injected via BuilderOptions
4. **Fully backward compatible** — No existing code needs to change
5. **Default behavior preserved** — When no renderer is injected, `DefaultPromptStrategyRenderer` provides sensible defaults
6. **Metadata-only** — No PromptContext, PromptRenderer, or compression changes

### Negative

1. **Not yet injected into prompt** — strategyRendered is metadata-only, not yet a prompt section
2. **Default renderer used even without explicit injection** — This means strategyRendered always appears in metadata

### Neutral

1. `DefaultPromptStrategyRenderer` is created for every `build()` call when no renderer is injected — acceptable for a stateless, lightweight object

---

## Alternatives Considered

### Render full strategy object

Rejected — the interface only has `name` and `applies()`. Rendering `applies()` is meaningless in textual output.

### Add strategyRendered to PromptContext

Deferred — would require changes to `PromptRenderer.CANONICAL_ORDER` and `DefaultPromptCompression.isPromptContextKey()`. The requirement explicitly states metadata-only.

### Skip rendering when renderer is absent

Rejected — `DefaultPromptStrategyRenderer` is used as the default, following the same pattern as all other BuilderOptions renderers (DefaultPromptRenderer, DefaultIntentRenderer, etc.).

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: Unchanged, all pass
- **New tests**: `PromptStrategyRenderingFoundation.test.ts` with comprehensive coverage

---

## References

- WO-S5-015 — Prompt Strategy Foundation
- WO-S5-016 — Prompt Strategy Consumption
- WO-S5-017 — Prompt Strategy Rendering Foundation
- ADR-0062 — Prompt Strategy Foundation
- ADR-0063 — Prompt Strategy Consumption
- `packages/ai/src/strategy/PromptStrategyRenderer.ts`
- `packages/ai/src/strategy/DefaultPromptStrategyRenderer.ts`
- `packages/ai/src/prompt/BuilderOptions.ts`
- `packages/ai/src/prompt/DefaultPromptBuilder.ts`
- `packages/ai/src/__tests__/PromptStrategyRenderingFoundation.test.ts`