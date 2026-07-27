# ADR-0058: Semantic Context Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-011  
**Architecture Version:** v0.46

---

## Context

The Prompt Assembly pipeline has two distinct semantic analysis stages: IntentAnalyzer (what the user wants to do) and EntityAnalyzer (what objects the user is referring to). Both produce structured results that are independently stored in AIRequest metadata.

However, there is no unified representation that combines both analysis results. Downstream components (Planner, AgentLoop, Reflection) must access two separate metadata keys and correlate them manually.

### Problem

1. **No unified semantic representation** — Intent and entity are separate, correlated only by the metadata object
2. **No abstraction for Planner evolution** — Future semantic-aware planners need a single input contract
3. **No composition layer** — Combining intent + entity requires manual code
4. **No extension point** — Future semantic types (sentiment, topic, etc.) have no place to plug in

### Constraints

1. **Foundation only** — No pipeline integration, no Planner integration, no Builder integration
2. **No breaking changes** — All existing interfaces unchanged
3. **No dependencies** — SemanticContext must NOT depend on Planner, Runtime, Provider, Memory, ToolCalling, AgentLoop, PromptBuilder, or Pipeline
4. **Interface-first** — SemanticContextBuilder defines the contract; DefaultSemanticContextBuilder is the simplest valid implementation
5. **Pure, stateless, deterministic** — Same inputs always produce same output
6. **Immutable** — All fields are readonly. No mutation of inputs.
7. **Extensible** — Fields are additive (string union extension)

---

## Decision

### 1. New Module: `packages/ai/src/semantic/`

A new top-level directory under `@genesis/ai` containing:

| File | Type | Purpose |
|------|------|---------|
| `SemanticContext.ts` | Interface | Unified semantic representation combining IntentResult + EntityResult |
| `SemanticContextBuilder.ts` | Interface | Contract for building SemanticContext from analysis results |
| `DefaultSemanticContextBuilder.ts` | Class | Default implementation — pure composition |
| `index.ts` | Exports | Barrel export for all semantic types |

### 2. SemanticContext — Unified Data Object

```typescript
interface SemanticContext {
  readonly intent?: IntentResult
  readonly entity?: EntityResult
}
```

- **Pure immutable data** — No methods, no behavior, no logic
- **readonly** — Immutable by design
- **Optional fields** — Intent and entity are independently optional
- **Extensible** — Future fields (sentiment, topic, etc.) can be added without breaking changes

### 3. SemanticContextBuilder — Interface

```typescript
interface SemanticContextBuilder {
  build(intent?: IntentResult, entity?: EntityResult): SemanticContext
}
```

- Single-method interface
- Accepts optional IntentResult and EntityResult
- Returns a new SemanticContext
- Implementations MUST be pure, deterministic, and side-effect free
- No dependencies on any other component

### 4. DefaultSemanticContextBuilder — Default Implementation

```typescript
class DefaultSemanticContextBuilder implements SemanticContextBuilder {
  build(intent?: IntentResult, entity?: EntityResult): SemanticContext {
    return {
      ...(intent !== undefined ? { intent } : {}),
      ...(entity !== undefined ? { entity } : {}),
    }
  }
}
```

- Pure composition — no inference, no modification, no filtering
- Returns new SemanticContext each call (immutable)
- No dependencies on any component
- Empty input → empty context

### 5. No Integration

This WO does NOT integrate SemanticContext with:
- BuilderOptions — No new field
- PromptBuilder — No pipeline stage
- Planner — Planner still receives raw text
- Pipeline — PipelineContext unchanged
- AgentLoop — No semantic-aware loop behavior
- IntentAnalyzer — Completely independent
- EntityAnalyzer — Completely independent

---

## Consequences

**Positive:**
- Well-defined semantic abstraction for future Planner evolution
- All existing code continues unchanged — no interface modifications
- Default implementation uses zero dependencies
- SemanticContext is testable in isolation (no dependencies)
- Pure function contract (no side effects, no mutation)
- Provider-agnostic — works identically with Mock, OpenAI, DeepSeek
- Future semantic types can be added as optional fields without breaking changes
- Complete backward compatibility preserved — no existing tests modified

**Negative:**
- No integration yet — SemanticContext must be manually wired in future WOs
- DefaultSemanticContextBuilder is a simple pass-through (no inference)

**Neutral:**
- SemanticContext, SemanticContextBuilder, DefaultSemanticContextBuilder added to public API
- Architecture version bumped to v0.46

---

## Future Work (Not Implemented)

| Capability | Description |
|-----------|-------------|
| SemanticContext → PromptAssembly | Inject SemanticContext into PromptAssembly pipeline |
| SemanticContext → Planner | Pass SemanticContext to Planner for semantic-aware planning |
| Semantic Rendering | Render SemanticContext in prompt |
| Sentiment Analysis | Add sentiment field to SemanticContext |
| Topic Detection | Add topic field to SemanticContext |

---

## References

- ADR-0048: Intent Analysis Foundation
- ADR-0053: Entity Recognition Foundation
- WO-S5-011: Semantic Context Foundation (this Work Order)
- `docs/project/AI_ARCHITECTURE.md` — Architecture reference
- `docs/project/PROJECT_STATE.md` — Current project state