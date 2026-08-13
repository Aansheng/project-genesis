# ADR-0192: Prompt Entity Count Extraction Foundation

**Status:** Accepted  
**Date:** Sprint 9  
**Work Order:** WO-S8-015  
**Architecture Version:** v1.78 → v1.79

---

## Context

WO-S8-014 introduced `DefaultPromptEntityExtractor` which extracts entity keywords from the overview title. However, the extraction only detected *entity existence* — it could not detect *how many* of each entity were requested.

Current behavior:

```
"farm with two farmers"
    ↓
[{ category: "npc", name: "Farmer" }]
```

Entity existence only. No quantity support.

### Problems

1. **No quantity support** — prompts specifying "two farmers" or "3 merchants" were treated identically to "farmer" or "merchant"
2. **No count extraction abstraction** — quantity detection had no dedicated interface or implementation
3. **Prompt expressiveness limited** — users could not influence the number of entities in the generated world

### Scope Boundaries

Foundation only — rule-based quantity extraction with no AI, no LLM, no NLP.
- No Runtime changes
- No Renderer changes
- No DSL changes
- No Projection changes
- No Input
- No Physics
- No Collision
- No LLM
- Rule-based only

---

## Decision

### 1. Create `ExtractedEntityCount` Interface

```typescript
export interface ExtractedEntityCount {
  readonly name: string
  readonly count: number
}
```

Represents a quantity associated with an extracted entity keyword. The `name` is the lowercase keyword, and `count` is the numeric quantity.

### 2. Create `PromptEntityCountExtractor` Interface

```typescript
export interface PromptEntityCountExtractor {
  extractCounts(model: PromptAssemblyDomainModel): readonly ExtractedEntityCount[]
}
```

A pure, stateless, deterministic contract for extracting entity counts from domain models.

### 3. Create `DefaultPromptEntityCountExtractor`

A rule-based implementation that scans the overview title for `<number> <keyword>` patterns.

**Supported numbers:**

| Type | Values |
|------|--------|
| Numeric | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 (any digits) |
| Word-based | one, two, three, four, five, six, seven, eight, nine, ten |

**Matching rules:**
- Title is tokenized into whitespace-separated words
- Each word is checked: is it a number (numeric or word)?
- If yes, the next word is checked against known entity keywords
- Plural handling via depluralization: `-ies → -y`, `-es →`, `-s →`
- Deduplication by keyword (first match wins)
- Output order follows catalog definition order (deterministic)
- All outputs are deeply frozen

### 4. Update `DefaultSemanticWorldGenerator`

Updated generation flow:

```
TemplateEntities
    ↓
ExtractedEntities (from PromptEntityExtractor)
    ↓
ExtractedEntityCounts (from PromptEntityCountExtractor)
    ↓
Expand Counts (merge counts with entities)
    ↓
Merge with template (dedup by name)
    ↓
GameWorldModel
```

**Constructor:** Added optional `countExtractor?: PromptEntityCountExtractor` parameter (defaults to `DefaultPromptEntityCountExtractor`).

**Count expansion rules:**
- count = 1 or no matching count → create one entity (no suffix)
- count > 1 → create N entities with suffixed ids (`name-1`, `name-2`, ...)
- Template dedup: if entity name matches a template entity, all instances are skipped
- Within expanded entities, all suffixed instances pass through (no intra-expansion dedup by name)

**Naming examples:**

| Input | Output |
|-------|--------|
| `one boss` | `boss` (id: boss) |
| `2 merchants` | `merchant-1`, `merchant-2` |
| `3 farmers` | `farmer-1`, `farmer-2`, `farmer-3` |

### 5. Location

| File | Action |
|------|--------|
| `packages/ai/src/game-world/extraction/ExtractedEntityCount.ts` | New — interface |
| `packages/ai/src/game-world/extraction/PromptEntityCountExtractor.ts` | New — interface |
| `packages/ai/src/game-world/extraction/DefaultPromptEntityCountExtractor.ts` | New — implementation |
| `packages/ai/src/game-world/extraction/index.ts` | Modified — added count exports |
| `packages/ai/src/game-world/index.ts` | Modified — added count exports |
| `packages/ai/src/game-world/DefaultSemanticWorldGenerator.ts` | Modified — count integration |
| `packages/ai/src/__tests__/PromptEntityCountExtractor.test.ts` | New — 48 tests |
| `packages/ai/src/__tests__/SemanticWorldGenerator.test.ts` | Modified — 148 → 222 tests (+74) |
| `docs/adr/ADR-0192-prompt-entity-count-extraction-foundation.md` | New — this document |

### 6. Test Strategy

**PromptEntityCountExtractor.test.ts** — 48 tests across 11 sections:

| Section | Coverage |
|---------|----------|
| Numeric counts | Digits 1-9, 10, single digit parsing |
| Word counts | one through ten, word-number mapping |
| Mixed case | Uppercase, mixed case, numeric with mixed case keywords |
| Multiple entities | Two counts, three counts, mixed numeric/word, sentence context |
| Duplicates | Same keyword repeated with different numbers, first match wins |
| Empty prompt | No overview, empty title, null title, number title |
| Invalid numbers | Standalone numbers, non-keyword following, keyword without number, dangling number |
| Large prompt | 100x repeats, 1000x non-keywords, large digit numbers |
| Immutability | Frozen array, frozen entries, no mutation, frozen input |
| Determinism | Same input, different extractors, catalog ordering, input order independence |
| Invalid inputs | Undefined, null, non-object, array |

**SemanticWorldGenerator.test.ts** — (46 → 148 → 222 total, +74 count tests):

| Section | Coverage |
|---------|----------|
| Count expansion | Single count=1 (no suffix), count=2 (suffixed), count=3, word "one", word "two" |
| Multi count | Different counts, mixed count=1 and count=3, entity without count |
| Mixed entities | Some with count, some without, count=5 |
| Dedup with counts | Template match skip, template miss with suffix, count=1 dedup |
| Ordering | Template first, numerical suffix order, deterministic |
| Compatibility | Existing extraction works, world type detection, valid categories, immutability |

---

## Consequences

### Positive

1. **Prompt quantities work** — "two farmers" now generates 2 farmer entities instead of 1
2. **No breaking changes** — `DefaultSemanticWorldGenerator` accepts optional count extractor; defaults to `DefaultPromptEntityCountExtractor`
3. **Existing tests preserved** — all 8928 existing tests pass unchanged
4. **Count extraction abstraction** — count extractors can be swapped independently
5. **Deterministic and immutable** — all count extraction outputs are deeply frozen
6. **Rule-based simplicity** — no LLM, no NLP, no AI calls
7. **Plural handling** — depluralization logic handles regular plurals (-s, -es) and irregular plurals (-ies → -y)

### Negative

1. **Foundation only** — no contextual count inference
2. **Adjacent number requirement** — number must immediately precede the keyword; "3 small farmers" would not match
3. **Limited word range** — only "one" through "ten" supported in word form; higher numbers require digits

### Neutral

1. **Extensible pattern** — follow-on WOs can add range-based extraction, proportional extraction, or semantic counting
2. **Shared keyword catalog** — count extractor uses the same entity keywords as the entity extractor
3. **Injector-friendly** — optional constructor parameter for DI

---

## Verification

- TypeScript: 0 errors (`packages/ai`)
- ESLint: 0 errors
- All PromptEntityCountExtractor tests pass: 48/48
- All SemanticWorldGenerator tests pass: 222/222
- All existing AI tests pass: 8928/8928
- No Runtime changes
- No Renderer changes
- No DSL changes
- No Projection changes
- No Input
- No Physics
- No Collision
- No LLM
- No breaking changes to any Public API

---

## Files Created/Modified

| File | Action |
|------|--------|
| `packages/ai/src/game-world/extraction/ExtractedEntityCount.ts` | New — interface |
| `packages/ai/src/game-world/extraction/PromptEntityCountExtractor.ts` | New — interface |
| `packages/ai/src/game-world/extraction/DefaultPromptEntityCountExtractor.ts` | New — implementation |
| `packages/ai/src/game-world/extraction/index.ts` | Modified — added count exports |
| `packages/ai/src/game-world/index.ts` | Modified — added count exports |
| `packages/ai/src/game-world/DefaultSemanticWorldGenerator.ts` | Modified — count integration |
| `packages/ai/src/__tests__/PromptEntityCountExtractor.test.ts` | New — 48 tests |
| `packages/ai/src/__tests__/SemanticWorldGenerator.test.ts` | Modified — 222 tests (+74) |
| `docs/adr/ADR-0192-prompt-entity-count-extraction-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.79, WO-S8-015 |
| `docs/project/CHANGELOG.md` | Updated — v1.79, WO-S8-015 |