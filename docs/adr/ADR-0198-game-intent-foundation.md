# ADR-0198: Game Intent Extraction Foundation

**Status:** Accepted  
**Date:** Sprint 9  
**Work Order:** WO-S8-016  
**Architecture Version:** v1.84 → v1.85

---

## Context

WO-S8-007 introduced `DefaultSemanticWorldGenerator` which converts a `PromptAssemblyDomainModel` into a `GameWorldModel`. The world type was detected from the overview title via keyword matching, but the system lacked an explicit concept of "Game Intent."

Current limitation:

```
PromptAssemblyDomainModel
    ↓
SemanticWorldGenerator
    ↓
GameWorldModel
```

`SemanticWorldGenerator` still relies mostly on world type detection and keyword extraction. There is no explicit concept of a `GameIntent` — a structured semantic model that answers "what kind of game does the user want to create?"

The system cannot yet distinguish:

- "Generate a Mario game" → platformer
- "Generate a farming game" → farm
- "Generate a survival game" → survival

using a dedicated, testable semantic model.

### Problems

1. **No structured intent model** — game genre detection is embedded inside `SemanticWorldGenerator` without a dedicated intent abstraction
2. **No testable extraction** — intent extraction logic has no isolated test surface
3. **No pure domain layer** — game intent belongs to a pure semantic layer, separate from world generation
4. **No genre type safety** — genre detection uses implicit string matching without a typed `GameGenre` union

### Scope Boundaries

Foundation only — pure semantic layer.
- No Runtime changes
- No Renderer changes
- No DSL changes
- No Projection changes
- No SemanticWorldGenerator changes yet
- No PromptBuilder changes
- No LLM integration
- No AI calls
- Rule-based only

---

## Decision

### 1. Create `GameGenre` Type

```typescript
export type GameGenre =
  | 'platformer'
  | 'farm'
  | 'rpg'
  | 'survival'
  | 'sandbox'
```

A closed union of five supported game genres. `sandbox` is the default fallback.

### 2. Create `GameIntent` Interface

```typescript
export interface GameIntent {
  readonly genre: GameGenre
  readonly title: string
}
```

A frozen semantic model representing the user's game intent. Contains the detected genre and the extracted game title. All fields are readonly. Outputs are always frozen.

### 3. Create `GameIntentExtractor` Interface

```typescript
export interface GameIntentExtractor {
  extract(model: PromptAssemblyDomainModel): GameIntent
}
```

A pure, stateless, deterministic contract for extracting game intents from domain models. Consumes `PromptAssemblyDomainModel` and produces a frozen `GameIntent`.

### 4. Create `DefaultGameIntentExtractor`

A rule-based implementation that scans the overview title for genre-indicative keywords:

| Keyword | Genre |
|---------|-------|
| mario | platformer |
| farm | farm |
| rpg | rpg |
| survival | survival |
| (none) | sandbox |

**Detection rules:**
- Case-insensitive matching (`lowerTitle.includes(keyword)`)
- Detection priority: mario > farm > rpg > survival > sandbox (checked in order)
- Output is always frozen

**Title extraction:**
- Uses `overview.title` if present and non-empty
- Falls back to `"Untitled Game"` when title is missing, empty, or not a string

### 5. Location

| File | Action |
|------|--------|
| `packages/ai/src/game-intent/GameIntent.ts` | New — types and interfaces |
| `packages/ai/src/game-intent/GameIntentExtractor.ts` | New — interface |
| `packages/ai/src/game-intent/DefaultGameIntentExtractor.ts` | New — implementation |
| `packages/ai/src/game-intent/index.ts` | New — barrel exports |
| `packages/ai/src/index.ts` | Updated — added game-intent exports |
| `packages/ai/src/__tests__/GameIntentExtractor.test.ts` | New — 80+ tests |
| `docs/adr/ADR-0198-game-intent-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.85, WO-S8-016 |
| `docs/project/CHANGELOG.md` | Updated — v1.85, WO-S8-016 |

### 6. Test Strategy

**GameIntentExtractor.test.ts** — 80+ tests across 16 sections:

| Section | Coverage |
|---------|----------|
| Construction | instance creation, method existence, interface conformance |
| Genre detection — platformer | "Mario", "mario", "MARIO", "MaRiO", sentence, start/end positions |
| Genre detection — farm | "Farm", "farm", "FARM", "FaRm", sentence, compound words |
| Genre detection — rpg | "RPG", "rpg", "Rpg", sentence, with punctuation |
| Genre detection — survival | "Survival", "survival", "SURVIVAL", mixed case, sentence |
| Genre detection — sandbox | empty model, unrecognized title, numeric, symbols, single char |
| Genre detection — priority | mario > farm > rpg > survival, all ordering combinations |
| Title extraction | all genres, full model, title preservation |
| Fallback title | empty model, undefined overview, null title, empty string, blank |
| Empty model | frozen empty, empty overview, no overview section |
| Null values | null model, null overview |
| Undefined values | undefined model, undefined title |
| Invalid model types | array, number, boolean, string, numeric title, null title |
| Large inputs | very long title, 1000 chars, keywords in long strings |
| Determinism | same model multiple times, different extractors, repeated calls |
| Immutability | frozen output, readonly fields, all genres frozen |
| Edge cases | spaces, tabs, newlines, unicode, emoji |
| Cross-contamination | no input mutation, independent extractions |

---

## Consequences

### Positive

1. **Structured intent model** — `GameIntent` provides a typed, immutable semantic model for game genre classification
2. **Isolated test surface** — 80+ dedicated tests for intent extraction with no dependencies on world generation
3. **No breaking changes** — `DefaultIntentExtractor` is a new module; no existing code is modified
4. **Extensible genre system** — new genres can be added to `GameGenre` without breaking changes
5. **Deterministic and immutable** — all extraction outputs are deeply frozen

### Negative

1. **Foundation only** — no integration with `SemanticWorldGenerator` yet (follow-up WO)
2. **Title-only detection** — only the overview title is scanned; other prompt sections are not leveraged
3. **Limited keywords** — each genre has a single detection keyword (intentionally minimal)

### Neutral

1. **Extensible pattern** — follow-on WOs can consume `GameIntent` in `SemanticWorldGenerator`
2. **Injector-friendly** — follows the same interface+implementation pattern as other extraction modules
3. **Forward-compatible** — additional detection rules and keywords can be added without breaking existing behavior

---

## Verification

- TypeScript: 0 errors (`packages/ai`)
- ESLint: 0 errors
- All GameIntentExtractor tests pass: 80/80+
- No Runtime changes
- No Renderer changes
- No DSL changes
- No Projection changes
- No SemanticWorldGenerator changes
- No PromptBuilder changes
- No LLM integration
- No breaking changes to any Public API

---

## Files Created/Modified

| File | Action |
|------|--------|
| `packages/ai/src/game-intent/GameIntent.ts` | New — types |
| `packages/ai/src/game-intent/GameIntentExtractor.ts` | New — interface |
| `packages/ai/src/game-intent/DefaultGameIntentExtractor.ts` | New — implementation |
| `packages/ai/src/game-intent/index.ts` | New — barrel exports |
| `packages/ai/src/index.ts` | Updated — barrel exports |
| `packages/ai/src/__tests__/GameIntentExtractor.test.ts` | New — 80+ tests |
| `docs/adr/ADR-0198-game-intent-foundation.md` | New — this document |
| `docs/project/PROJECT_STATE.md` | Updated — v1.85, WO-S8-016 |
| `docs/project/CHANGELOG.md` | Updated — v1.85, WO-S8-016 |