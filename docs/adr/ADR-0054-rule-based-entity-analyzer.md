# ADR-0054: Rule-Based Entity Analyzer

**Status:** Accepted  
**Date:** Sprint 5  
**Work Order:** WO-S5-007  
**Architecture Version:** v0.42

---

## Context

The Entity Layer (WO-S5-006) established the `EntityAnalyzer` interface and `DefaultEntityAnalyzer` placeholder. The placeholder returns `{ entities: [] }` for every input — it cannot detect any entity references.

The Prompt Assembly pipeline needs a production entity analyzer that can recognize entity types from user natural language input. The Rule-Based approach mirrors the successful pattern established by `RuleBasedIntentAnalyzer` (ADR-0049).

### Problem

1. **No entity detection** — `DefaultEntityAnalyzer` is a no-op; every input produces empty results
2. **Planner receives raw text** — Entity references must be re-parsed by the Planner or downstream
3. **No reusable entity recognition** — Every component that needs entity information must re-implement parsing
4. **Entity layer incomplete** — Foundation exists but has no production implementation

### Constraints

1. **Same interface** — Must implement `EntityAnalyzer` without modifying the interface
2. **Pure, stateless, deterministic** — No I/O, no LLM, no external dependencies
3. **No modifications to frozen components** — BuilderOptions, PromptBuilder, PromptRenderer, PromptCompression, PromptSelection, PromptContext unchanged
4. **No pipeline integration yet** — No wiring into BuilderOptions or PromptAssembly
5. **Backward compatible** — All existing tests must pass unchanged
6. **Extensible** — Future entity types must be additive

---

## Decision

### 1. RuleBasedEntityAnalyzer — Production V1

Create `packages/ai/src/entity/RuleBasedEntityAnalyzer.ts` implementing `EntityAnalyzer`.

**Algorithm:**

```
analyze(input):
  1. Trim — return empty if blank
  2. Normalize — remove punctuation, collapse whitespace, convert to lowercase
  3. Scan — find all keyword matches with position tracking
  4. Sort matches by position (first occurrence preserved)
  5. Deduplicate — first occurrence of each entity type wins
  6. Return EntityResult
```

### 2. Keyword Mapping

| EntityType | Chinese Keywords | English Keywords |
|-----------|-----------------|------------------|
| `Tree` | 树, 树木, 大树, 小树 | tree |
| `Flower` | 花, 鲜花, 花朵 | flower |
| `Grass` | 草, 草地 | grass |
| `House` | 房子, 房屋, 建筑 | house |
| `Rock` | 石头, 岩石 | rock |
| `Water` | 河, 河流, 水, 湖, 海 | river, water, lake, sea |
| `Character` | 人, 人物, 女孩, 男孩, 动物 | person, girl, boy, animal |

### 3. EntityType Extension

Add `'Character'` to the `EntityType` string union. This is an additive extension — backward compatible with all existing code.

### 4. Key Design Decisions

**Position-based scanning** — Unlike `RuleBasedIntentAnalyzer` which uses separator-based segmentation for multi-intent detection, entity recognition uses position-based scanning. Every keyword is searched across the entire input, and matches are sorted by position. This correctly handles:
- Multiple entities in arbitrary order
- Entities without separators (e.g., "树花房子")
- Entities in natural sentences (e.g., "draw a tree and a flower")

**Deterministic tie-breaking** — When multiple keywords match at the same position, `ENTITY_ORDER` priority resolves ties.

**Punctuation removal** — All CJK and Latin punctuation is stripped before matching, making entity detection robust against varied input formatting.

### 5. No Integration

This WO does NOT integrate `RuleBasedEntityAnalyzer` with:
- BuilderOptions — No new field
- PromptBuilder — No pipeline stage
- Planner — Planner still receives raw text
- Pipeline — PipelineContext unchanged
- AgentLoop — No entity-aware loop behavior

Integration is deferred to a future Work Order.

---

## Consequences

**Positive:**
- Production V1 entity detection for 7 entity types with 39+ keywords
- Deterministic, stateless, pure — no side effects, no I/O, no LLM
- No modifications to any existing interface or component
- All existing tests pass unchanged (1623 total)
- Export from package root for consumer access
- Additive entity type extension (Character added without breaking changes)
- Robust against punctuation, whitespace, mixed language, and duplicate entities

**Negative:**
- No pipeline integration — must be manually wired in future WOs
- Keyword-based — limited to predefined entity types and keywords
- No semantic understanding — "big tree" and "tiny tree" both map to Tree

**Neutral:**
- RuleBasedEntityAnalyzer added to public API
- Architecture version bumped to v0.42

---

## Future Work (Not Implemented)

| Capability | Description |
|-----------|-------------|
| Entity → PromptAssembly | Inject EntityResult into PromptContext via BuilderOptions |
| Entity Rendering | Render entities as "User Entities:" section in prompt |
| Entity Payload | Add quantity/position fields to Entity |
| LLMEntityAnalyzer | LLM-based semantic entity extraction |
| HeuristicEntityAnalyzer | Heuristic-based entity extraction |

---

## References

- ADR-0049: Rule-Based Intent Analyzer
- ADR-0053: Entity Recognition Foundation
- WO-S5-007: Rule-Based Entity Analyzer (this Work Order)
- `docs/project/AI_ARCHITECTURE.md` — Architecture reference
- `docs/project/PROJECT_STATE.md` — Current project state