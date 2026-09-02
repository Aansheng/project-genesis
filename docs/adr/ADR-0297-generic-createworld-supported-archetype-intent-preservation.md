# ADR-0297 — Generic CreateWorld Supported-Archetype Intent Preservation

- **Date:** 2026-09-02
- **Status:** Accepted after implementation and verification gates
- **Architecture:** v1.186 → v1.187
- **Work order:** `WO-S37-001 — Generic CreateWorld Supported-Archetype Intent Preservation`

## Context

Sprint 37 discovery found that the CreateWorld route was correct, but a clear
supported Farm request could lose its semantic type before provider and
deterministic generation. `DefaultGameIntentExtractor` recognized the English
`farm` signal but not the Chinese `农场` signal. Consequently,
`做一个农场游戏` produced `GameIntent.genre = sandbox`; both provider context
and deterministic fallback inherited that typed value and selected the
one-entity Sandbox template, even though the existing eight-entity Farm
template was reachable.

The existing supported `GameGenre` values are `platformer`, `survival`,
`farm`, `rpg`, and `sandbox`. The extractor already uses lowercase
normalization, substring matching, ordered precedence, immutable output, and
Sandbox as the unknown fallback. The fix must preserve those contracts and
must not turn a bounded alias gap into a general classifier or a second
semantic authority.

## Decision

Keep supported-archetype recognition at the existing pure
`DefaultGameIntentExtractor` seam. Represent the current non-fallback genre
aliases as one ordered, local, immutable table and add `农场` beside `farm`.
The table preserves the existing precedence and substring semantics for:

- Platformer: `mario`, `platformer`, and the existing Chinese platform aliases;
- Farm: `farm`, `农场`;
- RPG: `rpg`;
- Survival: `survival`, `survivor`, `生存`, `幸存者`.

The extracted typed `GameIntent` remains authoritative in the integrated
CreateWorld path:

```text
input → CreateWorld → DefaultGameIntentExtractor
  → GameIntent.genre = farm
  → provider candidate/validation or deterministic fallback
  → DefaultSemanticWorldGenerator(intent)
  → existing Farm template / Farm World DSL
  → Runtime / Observatory
```

Unknown or unsupported input continues to resolve to Sandbox. The IntentRouter,
provider candidate authority and validation, fallback composition, Farm
template, DSL, Runtime, Renderer, world replacement, and legacy-path
disposition are unchanged.

## Consequences

- Clean `做一个农场游戏` now reaches the existing Farm semantic composition
  even when the provider is unavailable and deterministic fallback is used.
- An active Survival world replaced by `做一个农场游戏` receives a new world
  identity and Farm semantics; it does not become an Evolution mutation.
- Platformer, Survival, RPG, and unknown Sandbox behavior remain bounded and
  regression-covered.
- The architecture advances only at the existing typed intent boundary. No
  `GenreClassifier`, `GenreRegistry`, `WorldTypeManager`, ontology/NLP layer,
  provider architecture, arbitrary genre support, or Farm mechanics are added.

## Verification

- AI full suite: **9441/9441**; Web full suite: **3583/3583**.
- Focused AI extractor and Web CreateWorld/fallback/active-world regressions:
  **117/117** and **44/44**.
- AI/Web TypeScript: **pass**; AI/Web ESLint: **0 errors**; Web build and
  `git diff --check`: **pass**.
- Real Studio: clean Farm and active Survival → Farm replacement produced the
  existing eight-entity `Farm World` through deterministic fallback; new-world
  identity and Observatory truth remained correct. Platformer, Survival, RPG,
  unknown-to-Sandbox, and browser error/warning diagnostics also passed.
- Fresh Sprint 37 Gap Analysis: **PASS**; repository stops at
  `SPRINT37_FREEZE_REVIEW` and does not enter Sprint 38.
