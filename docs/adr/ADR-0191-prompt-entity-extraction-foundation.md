# ADR-0191: Prompt Entity Extraction Foundation

**Status:** Accepted  
**Date:** Sprint 9  
**Work Order:** WO-S8-014  
**Architecture Version:** v1.77 → v1.78

---

## Context

WO-S8-007 introduced `DefaultSemanticWorldGenerator` which converts a `PromptAssemblyDomainModel` into a `GameWorldModel`. The world type was detected from the overview title via keyword matching, and default entities were generated using a `WorldTemplateCatalog`.

Current pipeline:

```
PromptAssemblyDomainModel
    ↓
overview.title
    ↓
keyword matching
    ↓
world type
    ↓
template
```

No prompt entity extraction existed — the prompt content only influenced the world type, not the generated entities themselves.

### Problems

1. **Prompt content underutilized** — only the world type was influenced by the prompt; entity generation was entirely template-driven
2. **No entity influence** — a prompt mentioning "merchant" and "barn" would not affect which entities appeared in the world
3. **No extraction abstraction** — entity recognition was tightly coupled to world type detection
4. **No test coverage for extraction** — extraction logic had no dedicated test surface

### Scope Boundaries

Foundation only — rule-based extraction with no AI, no LLM, no NLP.
- No Runtime changes
- No Renderer changes
- No DSL changes
- No Projection changes
- No Input changes
- No Physics changes
- No Collision changes
- No LLM
- Rule-based only

---

## Decision

### 1. Create `ExtractedEntity` Interface

```typescript
export interface ExtractedEntity {
  readonly category: EntityCategory
  readonly name: string
}
```

A lightweight contract representing an entity identified via keyword extraction. Has a semantic `category` and a human-readable `name`. No `id` field (IDs are generated during the merge step).

### 2. Create `PromptEntityExtractor` Interface

```typescript
export interface PromptEntityExtractor {
  extract(model: PromptAssemblyDomainModel): readonly ExtractedEntity[]
}
```

A pure, stateless, deterministic contract for extracting entities from domain models. Consumes `PromptAssemblyDomainModel` and produces a frozen array of `ExtractedEntity`.

### 3. Create `DefaultPromptEntityExtractor`

A rule-based implementation that scans the overview title for known keywords:

| Keyword | Category | Keyword | Category |
|---------|----------|---------|----------|
| merchant | npc | boss | enemy |
| farmer | npc | enemy | enemy |
| villager | npc | forest | terrain |
| barn | building | platform | terrain |
| storage | building | checkpoint | terrain |
| town | building | tree | terrain |
| quest | quest | stone | terrain |
| | | campfire | item |

**Matching rules:**
- Case-insensitive (`lowerTitle.includes(keyword)`)
- Deduplicated by keyword (first match wins)
- Output order follows catalog definition order (deterministic)
- All outputs are deeply frozen

### 4. Update `DefaultSemanticWorldGenerator`

Updated generation flow:

```
PromptAssemblyDomainModel
    ↓
PromptEntityExtractor
    ↓
ExtractedEntities
    ↓
TemplateEntities
    ↓
Merge (template first, extracted appended, deduplicated by name)
    ↓
GameWorldModel
```

**Constructor:** Added optional `entityExtractor?: PromptEntityExtractor` parameter (defaults to `DefaultPromptEntityExtractor`).

**Merge rules:**
1. Template entities come first (preserving template order)
2. Extracted entities are appended after template entities
3. Deduplication by name (case-insensitive): if an extracted entity's name matches any template entity's name, it is skipped
4. Deterministic ordering: template order → catalog order

### 5. Location

| File | Action |
|------|--------|
| `packages/ai/src/game-world/extraction/ExtractedEntity.ts` | New — interface |
| `packages/ai/src/game-world/extraction/PromptEntityExtractor.ts` | New — interface |
| `packages/ai/src/game-world/extraction/DefaultPromptEntityExtractor.ts` | New — implementation |
| `packages/ai/src/game-world/extraction/index.ts` | New — barrel exports |
| `packages/ai/src/game-world/DefaultSemanticWorldGenerator.ts` | Modified — extraction integration |
| `packages/ai/src/game-world/index.ts` | Modified — added extraction exports |
| `packages/ai/src/__tests__/PromptEntityExtractor.test.ts` | New — 51 tests |
| `packages/ai/src/__tests__/SemanticWorldGenerator.test.ts` | Modified — 97 tests (46 → 97, +51 extraction tests) |
| `docs/adr/ADR-0191-prompt-entity-extraction-foundation.md` | New — this document |

### 6. Test Strategy

**PromptEntityExtractor.test.ts** — 51 tests across 10 sections:

| Section | Coverage |
|---------|----------|
| Single keyword | Every keyword extracted with correct category and capitalized name |
| Multiple keywords | Combined keywords, cross-category, all NPCS, all terrain |
| Duplicates | Same keyword repeated, different casing, multiple keywords duplicated |
| Case insensitive | Uppercase, mixed case, lowercase in sentence, uppercase in sentence |
| Empty prompt | No overview, empty title, null title, number title |
| Unknown words | No known keywords, world type keywords only, random text |
| Large prompt | 100x repeats, 1000x unknown, all 15 keywords |
| Immutability | Frozen array, frozen entities, no mutation, frozen input |
| Determinism | Same input, different extractors, catalog order, input order independence |
| Invalid inputs | Undefined, null, non-object, array |

**SemanticWorldGenerator.test.ts** — 51 new extraction tests (46 → 97 total):

| Section | Coverage |
|---------|----------|
| Template only | No extraction keywords, existing tests preserved |
| Template + extraction | Sandbox + campfire, sandbox + multiple, survival + barn, farm + checkpoint |
| Deduplication | Template skip, partial dedup, RPG dedup, cross-category |
| Empty extraction | No overview, no keywords, empty model |
| Ordering | Template first, catalog order, template order preserved, deterministic |

---

## Consequences

### Positive

1. **Prompt influences entities** — prompt content now affects which entities appear in the generated world
2. **No breaking changes** — `DefaultSemanticWorldGenerator` accepts optional extractor; defaults to `DefaultPromptEntityExtractor`
3. **Existing tests preserved** — all 8859 existing tests pass unchanged
4. **Extraction abstraction** — extractors can be swapped without touching generation logic
5. **Deterministic and immutable** — all extraction outputs are deeply frozen
6. **Rule-based simplicity** — no LLM, no NLP, no AI calls

### Negative

1. **Foundation only** — no dynamic or semantic entity recognition
2. **Title-only extraction** — only the overview title is scanned; other prompt sections are not leveraged
3. **No context awareness** — "tree" and "stone" are always extracted as terrain, regardless of world type context

### Neutral

1. **Extensible pattern** — follow-on WOs can add multi-section extraction, weighted extraction, or semantic extraction
2. **15-keyword catalog** — can be extended without breaking existing behavior
3. **Injector-friendly** — optional constructor parameter for DI

---

## Verification

- TypeScript: 0 errors (`packages/ai`)
- ESLint: 0 errors
- All PromptEntityExtractor tests pass: 51/51
- All SemanticWorldGenerator tests pass: 97/97
- All existing AI tests pass: 8859/8859
- No Runtime changes
- No Renderer changes
- No DSL changes
- No Projection changes
- No Input changes
- No Physics changes
- No Collision changes
- No LLM
- No breaking changes to any Public API

---

## Files Created/Modified

| File | Action |
|------|--------|
| `packages/ai/src/game-world/extraction/ExtractedEntity.ts` | New — interface |
| `packages/ai/src/game-world/extraction/PromptEntityExtractor.ts` | New — interface |
| `packages/ai/src/game-world/extraction/DefaultPromptEntityExtractor.ts` | New — implementation |
| `packages/ai/src/game-world/extraction/index.ts` | New — barrel exports |
| `packages/ai/src/game-world/DefaultSemanticWorldGenerator.ts` | Modified — extraction integration |
| `packages/ai/src/game-world/index.ts` | Modified — added extraction exports |
| `packages/ai/src/__tests__/PromptEntityExtractor.test.ts` | New — 51 tests |
| `packages/ai/src/__tests__/SemanticWorldGenerator.test.ts` | Modified — 97 tests (+51) |
| `docs/adr/ADR-0191-prompt-entity-extraction-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.78, WO-S8-014 |
| `docs/project/CHANGELOG.md` | Updated — v1.78, WO-S8-014 |