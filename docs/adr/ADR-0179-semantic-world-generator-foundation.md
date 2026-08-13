# ADR-0179: Semantic World Generator Foundation

**Status:** Accepted  
**Date:** Sprint 8  
**Work Order:** WO-S8-007  
**Architecture Version:** v1.65 → v1.66

---

## Context

WO-S8-005 introduced `GameWorldModel`, `WorldType`, `EntityCategory`, and `GameWorldEntity` — the first domain-level game concepts. WO-S8-006 introduced `SemanticGameDslBuilder`, which converts `GameWorldModel` → `GameDsl`.

What remains missing is the **generation path** from observatory data (`PromptAssemblyDomainModel`) to the semantic world model. Currently the pipeline is:

```
PromptAssemblyDomainModel (observatory metadata)
     ↓
    (MISSING — SemanticWorldGenerator)
     ↓
GameWorldModel (semantic)
     ↓
SemanticGameDslBuilder
     ↓
GameDsl (structural)
     ↓
RuntimeProjection
     ↓
Runtime
```

### Current Architecture

```
PromptAssemblyDomainModel ──→ DefaultGameDslBuilder ──→ GameDsl (structural only)
                              (section → entity, no semantics)

PromptAssemblyDomainModel ──→ (missing) ──→ GameWorldModel ──→ SemanticGameDslBuilder ──→ GameDsl
```

### Problem

1. **No generation path** — there is no mechanism to convert `PromptAssemblyDomainModel` into a `GameWorldModel`
2. **No semantic synthesis** — the domain model has observability data but no way to derive game concepts (world type, entity categories)
3. **Pipeline gap** — the semantic layer is disconnected from the observability layer

### Scope Boundaries

- Foundation only — no AI generation, no LLM integration, no gameplay systems
- Rule-based only — deterministic keyword matching, no heuristics, no AI
- No Runtime changes
- No Projection changes
- No Renderer changes
- No PixiJS
- No Planner changes
- No PromptBuilder changes
- No Domain Model changes
- No DSL changes
- No ECS changes

---

## Decision

### 1. Create `SemanticWorldGenerator` Interface

```typescript
export interface SemanticWorldGenerator {
  generate(model: PromptAssemblyDomainModel): GameWorldModel
}
```

### 2. Create `DefaultSemanticWorldGenerator` Implementation

Pure, stateless, deterministic, rule-based, with deeply frozen outputs.

### 3. World Type Detection Rules

The world type is derived from the overview section's `title` field (forward-compatible extraction):

| Keyword in Title | World Type |
|------------------|------------|
| Contains `"farm"` | `'farm'` |
| Contains `"rpg"` | `'rpg'` |
| Contains `"platform"` | `'platformer'` |
| Contains `"survival"` | `'survival'` |
| No match / no title | `'sandbox'` (default) |

Matching is case-insensitive. The title is accessed via the same forward-compatible pattern used by `DefaultGameDslBuilder`.

### 4. Default Entity Templates

Each world type has a fixed set of default entities:

| World Type | Entities |
|------------|----------|
| `farm` | player, merchant, wheat-field, harvest-quest |
| `rpg` | player, villager, quest-giver, enemy |
| `platformer` | player, terrain, enemy |
| `survival` | player, resource, enemy |
| `sandbox` | player |

### 5. Location

| File | Purpose |
|------|---------|
| `packages/ai/src/game-world/SemanticWorldGenerator.ts` | New — interface |
| `packages/ai/src/game-world/DefaultSemanticWorldGenerator.ts` | New — implementation |
| `packages/ai/src/game-world/index.ts` | Modified — added exports |
| `packages/ai/src/index.ts` | Modified — added game-world generator exports |
| `packages/ai/src/__tests__/SemanticWorldGenerator.test.ts` | New — tests |

### 6. Test Strategy

| Section | Tests | Coverage |
|---------|-------|----------|
| Construction | 4 | Builder creation, interface conformance, build method |
| All World Types | 7 | 5 world types via keyword, case-insensitive, compound keywords |
| Default World | 5 | No overview, no title, empty/null/non-string title → sandbox |
| Entity Generation | 17 | All 5 world types, entity ids/categories/names per type |
| Immutability | 6 | Frozen result/entities/entities, empty result, input unchanged |
| Determinism | 6 | Same input, multiple generators, all types, order, empty |
| Serialization | 7 | JSON stringify, key presence, entity data, round-trip |
| Large Inputs | 3 | 100/1000 traces, large model with title |
| Invalid Inputs | 4 | undefined/null/non-object/array → safe empty result |
| Empty Model | 6 | Sandbox default, single entity, frozen, deterministic |
| Partial Model | 5 | Overview only, title in overview, full model sans title |
| Edge Cases | 7 | Case handling, compound keywords, stateless, type validity |

---

## Consequences

### Positive

1. **First semantic generation path** — `PromptAssemblyDomainModel` can now produce a `GameWorldModel`
2. **Completes the semantic pipeline** — observatory → world model → DSL → Runtime
3. **Deterministic rule-based** — no AI, no LLM, no heuristics
4. **Forward-compatible title extraction** — same pattern as `DefaultGameDslBuilder`
5. **No breaking changes** — all existing types and code are unchanged

### Negative

1. **Fixed entity templates** — generated entities are hardcoded per world type (future work could make them data-driven or AI-generated)
2. **Keyword-based detection** — world type detection is limited to keyword matching (future work could use AI for intent detection)

### Neutral

1. **Foundation only** — no AI generation, no LLM, no gameplay execution
2. **Rule-based** — deterministic, predictable, testable

---

## Verification

- TypeScript: 0 errors (`packages/ai`, `packages/shared`)
- ESLint: 0 errors
- All SemanticWorldGenerator tests pass
- All existing tests continue to pass
- No Runtime changes
- No Projection changes
- No Renderer changes
- No PixiJS
- No Planner changes
- No PromptBuilder changes
- No Domain Model changes
- No DSL changes
- No ECS changes
- No LLM integration
- No breaking changes to any Public API

---

## Files Created/Modified

| File | Action |
|------|--------|
| `packages/ai/src/game-world/SemanticWorldGenerator.ts` | New — interface |
| `packages/ai/src/game-world/DefaultSemanticWorldGenerator.ts` | New — implementation |
| `packages/ai/src/game-world/index.ts` | Modified — added exports |
| `packages/ai/src/index.ts` | Modified — added game-world generator exports |
| `packages/ai/src/__tests__/SemanticWorldGenerator.test.ts` | New — 72 tests across 12 sections |
| `docs/adr/ADR-0179-semantic-world-generator-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.66, WO-S8-007 |
| `docs/project/CHANGELOG.md` | Updated — v1.66, WO-S8-007 |