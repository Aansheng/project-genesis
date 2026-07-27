# ADR-0053: Entity Recognition Foundation

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-006  
**Architecture Version:** v0.41

---

## Context

The Prompt Assembly pipeline (v0.40) has an Intent Layer that can analyze user intentions (`Create`, `Move`, `Delete`, etc.) and render them into the final prompt. However, there is no abstraction layer for recognizing *what entities* the user is referring to.

The pipeline currently flows:

```
User Natural Language
    ↓
IntentAnalyzer → IntentResult (what the user wants to do)
    ↓
IntentRenderer → "User Intent:" section
    ↓
... → PromptRenderer → AIRequest
```

There is no representation of *what objects* the user is talking about — only the action type. Every downstream component must re-parse entity references from scratch.

### Problem

1. **No entity abstraction** — Natural language entity references have no intermediate representation
2. **No reusable entity type** — Planner, Reflection, and AgentLoop each interpret entity references independently
3. **No foundation for future semantic understanding** — Entity-based planning, entity-aware rendering, and entity-specific tools have no abstraction to plug into

### Constraints

1. **Foundation only** — This WO establishes the abstraction. No planner integration, no LLM integration, no runtime integration, no Builder integration, no Prompt integration, no Rendering.
2. **No breaking changes** — All existing interfaces unchanged. No modifications to existing components.
3. **No dependencies** — EntityAnalyzer must NOT depend on Planner, Runtime, Provider, Memory, Intent, ToolCalling, AgentLoop, PromptBuilder, or Pipeline.
4. **Interface-first** — EntityAnalyzer defines the contract; DefaultEntityAnalyzer is the simplest valid implementation.
5. **Pure, stateless, deterministic** — Same input always produces same output. No side effects.
6. **Immutable** — All types are readonly. No mutation of inputs.
7. **Extensible** — EntityType is a string union (additive). Entity can carry optional payload in the future.

---

## Decision

### 1. New Module: `packages/ai/src/entity/`

A new top-level directory under `@genesis/ai` containing:

| File | Type | Purpose |
|------|------|---------|
| `EntityType.ts` | String union | Recognized entity types (Tree, Flower, House, Rock, Water, Grass, Unknown) |
| `Entity.ts` | Interface | Singleton entity with type discriminator |
| `EntityResult.ts` | Interface | Container for multiple entities |
| `EntityAnalyzer.ts` | Interface | Contract for extracting entities from natural language |
| `DefaultEntityAnalyzer.ts` | Class | Placeholder implementation (empty result) |
| `index.ts` | Exports | Barrel export for all entity types |

### 2. EntityType — String Union

```typescript
type EntityType =
  | 'Tree'
  | 'Flower'
  | 'House'
  | 'Rock'
  | 'Water'
  | 'Grass'
  | 'Unknown'
```

- **String union** — Extensible by adding new literal types. No modification needed for existing code.
- **7 foundation types** — Cover common entity types for Project Genesis:
  - `Tree`, `Flower`, `House`, `Rock`, `Water`, `Grass` — Named entity types
  - `Unknown` — Catch-all for unrecognized entity references

### 3. Entity — Immutable Data Object

```typescript
interface Entity {
  readonly type: EntityType
}
```

- **Pure data** — No methods, no behavior, no logic
- **readonly** — Immutable by design
- **Minimal** — Future optional payload field can be added without breaking changes

### 4. EntityResult — Multiple Entities

```typescript
interface EntityResult {
  readonly entities: readonly Entity[]
}
```

- Supports multiple entities from a single input (e.g., "draw a tree and a flower" → 2 entities)
- Empty array is valid (when no entity could be determined)
- readonly — immutable by design

### 5. EntityAnalyzer — Interface

```typescript
interface EntityAnalyzer {
  analyze(input: string): EntityResult
}
```

- Single-method interface
- Accepts natural language input, returns EntityResult
- Implementations MUST be pure, deterministic, and side-effect free
- No dependencies on any other component
- Future implementations: RuleBasedEntityAnalyzer, HeuristicEntityAnalyzer, LLMEntityAnalyzer

### 6. DefaultEntityAnalyzer — Placeholder

```typescript
class DefaultEntityAnalyzer implements EntityAnalyzer {
  analyze(_input: string): EntityResult {
    return { entities: [] }
  }
}
```

- Returns empty `{ entities: [] }` for every input
- No parsing, no AI, no heuristics, no runtime
- Serves as the default implementation for the interface
- All future implementations must produce the same type (EntityResult)

### 7. No Integration

This WO does NOT integrate EntityAnalyzer with:
- PromptBuilder — No new pipeline stage
- Planner — Planner still receives raw natural language
- Pipeline — PipelineContext unchanged
- AgentLoop — No entity-aware loop behavior
- Reflection — Reflection does not consume entities
- Intent — EntityAnalyzer is completely independent from IntentAnalyzer
- BuilderOptions — No `entityAnalyzer` field added

Integration with PromptBuilder (Entity → PromptAssembly) is deferred to a future Work Order.

---

## Consequences

**Positive:**
- Well-defined entity abstraction for future semantic understanding
- All existing code continues unchanged — no interface modifications
- Default implementation uses zero dependencies (empty result only)
- Entity is testable in isolation (no dependencies)
- Pure function contract (no side effects, no mutation)
- Provider-agnostic — works identically with Mock, OpenAI, DeepSeek
- Future RuleBasedEntityAnalyzer, LLMEntityAnalyzer can slot in via same interface
- String union EntityType allows additive extension without breaking changes
- Complete backward compatibility preserved — no existing tests modified

**Negative:**
- No integration yet — EntityAnalyzer must be manually wired in future WOs
- DefaultEntityAnalyzer is a no-op (always returns empty result)

**Neutral:**
- Entity, EntityType, EntityResult, EntityAnalyzer, DefaultEntityAnalyzer added to public API
- Architecture version bumped to v0.41

---

## Future Work (Not Implemented)

| Capability | Description |
|-----------|-------------|
| RuleBasedEntityAnalyzer | Keyword-based entity detection (e.g., "tree" → Tree, "flower" → Flower) |
| LLMEntityAnalyzer | LLM-based semantic entity extraction |
| Entity → PromptAssembly | Inject EntityResult into PromptContext for Planner awareness |
| Entity Rendering | Render entities as "User Entity:" section in the prompt |
| Entity Payload | Add quantity/position fields to Entity for data-carrying entities |

---

## References

- ADR-0048: Intent Analysis Foundation
- ADR-0052: Intent Prompt Integration
- WO-S5-006: Entity Recognition Foundation (this Work Order)
- `docs/project/AI_ARCHITECTURE.md` — Architecture reference
- `docs/project/PROJECT_STATE.md` — Current project state