# ADR-0062: Prompt Strategy Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-015  
**Architecture Version:** v0.50

---

## Context

The Prompt Assembly pipeline is currently complete with a single, implicit prompt strategy shared by all requests. The pipeline flow is:

```
Natural Language → IntentAnalyzer → IntentRenderer → EntityAnalyzer → EntityRenderer
→ SemanticContextBuilder → SemanticContextRenderer → MemoryRanking → PromptBudget
→ ProviderBudget → PromptSelection → PromptCompression → PromptRenderer → Planner
```

All requests go through exactly the same prompt assembly process regardless of their semantic characteristics. There is no mechanism to vary prompt assembly behavior based on context.

### Problem

1. **No strategy abstraction** — All requests share the same prompt assembly logic
2. **No context-aware routing** — Cannot select different strategies based on intent or entity types
3. **No extension point** — Adding new prompt assembly behaviors requires modifying the Builder
4. **No explicit default** — The current behavior is implicit, not a first-class citizen
5. **No selector mechanism** — No way to determine which strategy applies for a given context

### Constraints

1. **No behavior changes yet** — This WO establishes architecture only
2. **No integration into Builder** — PromptStrategy is not yet consumed by DefaultPromptBuilder
3. **No BuilderOptions changes** — PromptStrategy is not added to BuilderOptions
4. **No Prompt changes** — Prompt, PromptContext, AIRequest unchanged
5. **No Pipeline changes** — Pipeline interface, DefaultPipeline unchanged
6. **No breaking changes** — All existing tests pass with zero modifications
7. **No Sprint 4 frozen interface modifications**
8. **Additive only** — New interfaces, new classes, no deletions or modifications

---

## Decision

Introduce the `PromptStrategy` abstraction as a new architectural layer:

### PromptStrategy Interface

```typescript
interface PromptStrategy {
  readonly name: string
  applies(context: SemanticContext): boolean
}
```

- `name` — Unique identifier for the strategy (e.g., `'default'`, `'query'`, `'creation'`)
- `applies()` — Pure predicate that determines if this strategy is appropriate for the given `SemanticContext`
- No methods beyond the contract — pure interface
- No dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline

### DefaultPromptStrategy

```typescript
class DefaultPromptStrategy implements PromptStrategy {
  readonly name = 'default'
  applies(_context: SemanticContext): boolean {
    return true
  }
}
```

- Always applies — returns `true` for any `SemanticContext`
- Acts as the current baseline strategy
- Ensures backward compatibility — existing behavior is preserved as the default
- Pure, stateless, deterministic — no side effects

### PromptStrategySelector Interface

```typescript
interface PromptStrategySelector {
  select(
    strategies: readonly PromptStrategy[],
    context: SemanticContext,
  ): PromptStrategy
}
```

- Given an ordered list of strategies and a SemanticContext, returns the appropriate strategy
- Pure function contract — same inputs always produce same result
- Stateless, deterministic, no side effects

### DefaultPromptStrategySelector

```typescript
class DefaultPromptStrategySelector implements PromptStrategySelector {
  select(strategies, context): PromptStrategy {
    for (const strategy of strategies) {
      if (strategy.applies(context)) {
        return strategy
      }
    }
    return new DefaultPromptStrategy()  // fallback
  }
}
```

- **First-match wins** — Returns first strategy whose `applies()` returns `true`
- **Default fallback** — Returns `DefaultPromptStrategy` when no strategy matches
- **Pure** — No side effects, no state mutations
- **Stateless** — No internal state between calls
- **Deterministic** — Same inputs always produce same result
- **Complete** — Always returns a strategy (never `null`, never `undefined`)

### Architecture

```
PromptStrategySelector.select(strategies, SemanticContext)
    ↓
For each strategy in order:
  ├── strategy.applies(context) === true → return strategy
  └── No match → return DefaultPromptStrategy
```

The Strategy Layer sits alongside the existing Prompt Assembly pipeline:

```
SemanticContext →
  PromptStrategySelector.select(strategies, context) →
    PromptStrategy (determines prompt assembly behavior)
```

### Dependency Rules

- `PromptStrategy` is independent — no dependencies on any existing component
- `DefaultPromptStrategy` depends only on `PromptStrategy` and `SemanticContext`
- `PromptStrategySelector` depends only on `PromptStrategy` and `SemanticContext`
- `DefaultPromptStrategySelector` depends only on `PromptStrategySelector`, `PromptStrategy`, `DefaultPromptStrategy`, and `SemanticContext`
- None of the strategy components depend on Planner, Runtime, Provider, Memory, ToolCalling, AgentLoop, PromptBuilder, or Pipeline

---

## Consequences

### Positive

1. **Explicit strategy abstraction** — Prompt assembly behavior is now a first-class citizen
2. **Extension point** — New strategies can be added without modifying existing interfaces
3. **Context-aware routing** — Strategies can be selected based on SemanticContext
4. **Backward compatible** — DefaultPromptStrategy preserves existing behavior
5. **Zero breakage** — No existing interfaces, classes, or tests modified
6. **Following Sprint 5 patterns** — Interface + Default implementation pattern used throughout Sprint 5
7. **Minimal** — Only 4 source files, zero new dependencies

### Negative

1. **Not yet consumed** — Strategy Layer is established but not yet integrated into the Builder
2. **No behavior change yet** — All prompts still use the default strategy

### Neutral

1. `DefaultPromptStrategySelector` creates a new `DefaultPromptStrategy` instance for each fallback — acceptable for a stateless, lightweight object

---

## Alternatives Considered

### Strategy as function type

```typescript
type PromptStrategy = (context: SemanticContext) => boolean
```

Rejected — no `name` for identification, no extensibility for future fields (e.g., priority, configuration).

### Strategy as configuration object

```typescript
interface PromptStrategy {
  name: string
  applies: (context: SemanticContext) => boolean
  priority?: number
  config?: Record<string, unknown>
}
```

Deferred — additional fields can be added later without breaking changes. Current interface is minimal and sufficient.

### Selector as function (not interface)

```typescript
function selectStrategy(strategies, context): PromptStrategy
```

Rejected — interface allows for multiple selector implementations (weighted, priority-based, etc.) without changing the contract.

### Last-match wins

Rejected — first-match is more intuitive for strategy ordering (more specific → more general).

### Throw on no match

Rejected — `DefaultPromptStrategy` ensures completeness. Throwing would require callers to handle a case that should never occur.

---

## Verification

- **TypeScript**: 0 errors
- **ESLint**: 0 errors
- **Existing tests**: Unchanged, all pass
- **New tests**: `PromptStrategyFoundation.test.ts` with comprehensive coverage:
  - PromptStrategy interface (4 tests)
  - DefaultPromptStrategy (6 tests)
  - Deterministic (2 tests)
  - Stateless (2 tests)
  - Pure / no side effects (2 tests)
  - Custom PromptStrategy implementations (5 tests)
  - PromptStrategySelector interface (3 tests)
  - First-match wins (5 tests)
  - Default fallback (5 tests)
  - Stateless (2 tests)
  - Deterministic (2 tests)
  - Pure / no side effects (3 tests)
  - Exports (8 tests)
  - Architecture compliance (11 tests)
  - RetryPlanner Compatibility (2 tests)
  - ToolCallPlanner Compatibility (2 tests)
  - Streaming Compatibility (2 tests)
  - AgentLoop Compatibility (2 tests)

---

## References

- WO-S5-015 — Prompt Strategy Foundation
- `packages/ai/src/strategy/PromptStrategy.ts`
- `packages/ai/src/strategy/DefaultPromptStrategy.ts`
- `packages/ai/src/strategy/PromptStrategySelector.ts`
- `packages/ai/src/strategy/DefaultPromptStrategySelector.ts`
- `packages/ai/src/strategy/index.ts`
- `packages/ai/src/__tests__/PromptStrategyFoundation.test.ts`