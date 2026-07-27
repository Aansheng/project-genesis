# ADR-0063: Prompt Strategy Consumption

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-016  
**Architecture Version:** v0.51

---

## Context

WO-S5-015 established the Strategy Layer with `PromptStrategy` and `PromptStrategySelector` abstractions. However, the Strategy Layer exists as a standalone abstraction — it is never consumed by the Prompt Builder pipeline.

The current Prompt Assembly pipeline is:

```
Modules → IntentAnalyzer → IntentRenderer → EntityAnalyzer → EntityRenderer
→ SemanticContextBuilder → SemanticContextRenderer → [Strategy Layer exists but unused]
→ MemoryRanking → PromptBudget → ProviderBudget → PromptSelection
→ PromptCompression → PromptRenderer
```

### Problem

1. **Strategy Layer is dead code** — `PromptStrategy` and `PromptStrategySelector` exist but are never invoked
2. **No metadata for strategy** — Downstream components (Planner, Observability) cannot inspect which strategy was selected
3. **No consumption pathway** — Future work orders that depend on strategy selection have no integration point
4. **Incomplete Sprint 5 integration** — Every other Sprint 5 layer (Intent, Entity, Semantic Context) has been consumed by the Builder — the Strategy Layer is the only remaining unconsumed layer

### Constraints

1. **No behavior changes** — Strategy selection must not alter prompt assembly behavior
2. **Metadata only** — Strategy name stored in `AIRequest.metadata.promptAssembly.strategy`, never in `PromptContext`
3. **No PromptContext changes** — `PromptContext` remains unchanged
4. **No prompt rendering changes** — Strategy name does not appear in the final prompt string
5. **No Planner changes** — Planner interface, RetryPlanner, ToolCallPlanner unchanged
6. **No Pipeline changes** — Pipeline interface, DefaultPipeline unchanged
7. **No Runtime changes**
8. **No AgentLoop changes**
9. **No breaking changes** — All existing tests pass with zero modifications
10. **Additive only** — New fields in BuilderOptions, new phase in builder

---

## Decision

### BuilderOptions Extension

Add two optional fields to `BuilderOptions`:

```typescript
interface BuilderOptions {
  // ... existing fields unchanged ...

  /** Optional PromptStrategySelector (defaults to undefined) */
  strategySelector?: PromptStrategySelector

  /** Optional list of PromptStrategy to select from (defaults to undefined) */
  strategies?: readonly PromptStrategy[]
}
```

Both fields are optional — fully backward compatible.

### Phase 0.9: Strategy Selection

Insert a new phase between Phase 0.85 (SemanticContextRenderer) and Phase 1 (MemoryRanking):

```
Phase 0.85: SemanticContextRenderer.render()
    ↓
Phase 0.9:  PromptStrategySelector.select(strategies, semanticContext)
    ↓
Phase 1:    MemoryRanking.rank()
```

Selection logic:

```typescript
const selectedStrategy: PromptStrategy =
  this.strategySelector !== undefined && this.strategies !== undefined
    ? this.strategySelector.select(this.strategies, semanticContext ?? {})
    : new DefaultPromptStrategy()
```

- If both `strategySelector` and `strategies` are provided → invoke `select()`
- If `semanticContext` is `undefined` (no `SemanticContextBuilder`) → pass empty `{}`
- If either is absent → fallback to `DefaultPromptStrategy`

### Metadata Storage

Store the selected strategy in `AIRequest.metadata.promptAssembly.strategy`:

```typescript
strategy: { name: selectedStrategy.name }
```

Example:

```typescript
{
  promptAssembly: {
    // ... other assembly results ...
    strategy: { name: "default" },
    ranking: { ... },
    budget: { ... },
    selection: { ... },
  }
}
```

Only the strategy `name` is recorded. Future fields (priority, config, etc.) can be added to the strategy object without breaking changes.

### No PromptContext Changes

The strategy is NOT added to `PromptContext`. It exists only in `AIRequest.metadata`. This ensures:
- No rendering changes needed
- No compression changes needed
- No pipeline changes needed

### Flow Diagram

```
DefaultPromptBuilder.build(context)
    ↓
Modules → PromptContext (unchanged)
    ↓
Phase 0:   IntentAnalyzer.analyze()          → metadata.promptAssembly.intent
Phase 0.5: IntentRenderer.render()           → metadata.promptAssembly.intentRendered
Phase 0.75: EntityAnalyzer.analyze()         → metadata.promptAssembly.entity
Phase 0.875: EntityRenderer.render()         → metadata.promptAssembly.entityRendered
Phase 0.8:  SemanticContextBuilder.build()   → metadata.promptAssembly.semantic
Phase 0.85: SemanticContextRenderer.render() → metadata.promptAssembly.semanticRendered
Phase 0.9:  StrategySelector.select()        → metadata.promptAssembly.strategy  ← NEW
Phase 1:    MemoryRanking.rank()             → metadata.promptAssembly.ranking
Phase 2:    PromptBudget.calculate()         → metadata.promptAssembly.budget
Phase 2.5:  ProviderBudget.getBudget()       → metadata.promptAssembly.providerBudget
Phase 3:    PromptSelection.select()         → metadata.promptAssembly.selection
Phase 4:    PromptCompression.compress()     → (returns new PromptContext)
Phase 6:    PromptRenderer.render()          → prompt string
    ↓
AIRequest { prompt, metadata.promptAssembly }
```

### Dependency Rules

- `BuilderOptions` now depends on `PromptStrategy` and `PromptStrategySelector` (type-only)
- `DefaultPromptBuilder` now depends on `PromptStrategySelector` (type-only) and `DefaultPromptStrategy` (import)
- No new runtime dependencies — all strategy types are already in the package
- No changes to any Sprint 4 frozen interface

---

## Consequences

### Positive

1. **Strategy Layer is now consumed** — Strategy is selected and recorded for every prompt assembly
2. **Backward compatible** — All existing code works unchanged without providing strategySelector or strategies
3. **Metadata visibility** — Downstream components can inspect which strategy was active
4. **Future-ready** — Strategy-selection-aware prompt assembly can be added in future WOs without architecture changes
5. **No behavior change** — Prompt content is identical regardless of strategy selection
6. **Following Sprint 5 pattern** — Same consumption pattern as Intent, Entity, and Semantic Context layers

### Negative

1. **Strategy consumed but behaviorally inert** — Strategy selection happens but doesn't influence prompt assembly yet
2. **Two-phase fallback** — Need to check both `strategySelector` and `strategies` independently

### Neutral

1. `DefaultPromptStrategy` is instantiated on each fallback — acceptable for a stateless, lightweight object

---

## Alternatives Considered

### Store strategy in PromptContext

Rejected — would require changes to `PromptContext`, `DefaultPromptRenderer`, and `DefaultPromptCompression`. The requirement explicitly states metadata-only.

### Always require strategySelector

Rejected — would break all existing consumers that don't provide it. Both fields are optional for full backward compatibility.

### Store full strategy object in metadata

Rejected — storing the full strategy object would include potentially mutable behavior. Storing only `{ name }` is safer and sufficient for metadata purposes.

### Execute strategy selection at the beginning of build()

Rejected — strategy selection depends on `SemanticContext`. It must occur after `SemanticContextBuilder` (Phase 0.8) to have access to the full semantic picture.

### Add strategy only when selector is provided

Rejected — `DefaultPromptStrategy` should always be recorded as the active strategy, even when no selector is injected. This provides a consistent metadata contract.

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: Unchanged, all pass
- **New tests**: `PromptStrategyConsumption.test.ts` with comprehensive coverage:
  - BuilderOptions — strategySelector field (6 tests)
  - Strategy selection — selector invocation (4 tests)
  - Strategy selection — fallback (6 tests)
  - Strategy selection — metadata (5 tests)
  - Strategy selection — deterministic (2 tests)
  - Strategy selection — stateless (2 tests)
  - Builder compatibility (4 tests)
  - Pipeline compatibility (2 tests)
  - RetryPlanner Compatibility (2 tests)
  - ToolCallPlanner Compatibility (2 tests)
  - Streaming Compatibility (2 tests)
  - AgentLoop Compatibility (2 tests)
  - No modifications to existing components (4 tests)

---

## References

- WO-S5-015 — Prompt Strategy Foundation (established Strategy Layer)
- WO-S5-016 — Prompt Strategy Consumption
- ADR-0062 — Prompt Strategy Foundation
- `packages/ai/src/prompt/BuilderOptions.ts`
- `packages/ai/src/prompt/DefaultPromptBuilder.ts`
- `packages/ai/src/__tests__/PromptStrategyConsumption.test.ts`