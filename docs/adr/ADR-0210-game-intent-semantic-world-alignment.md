# ADR-0210: Game Intent → Semantic World Alignment Foundation

**Status:** Accepted  
**Date:** Sprint 10  
**Work Order:** WO-S10-008  
**Architecture Version:** v1.96 → v1.97

## Context

The create-world pipeline extracted a `GameIntent` but discarded it. The
semantic world generator then independently inferred `worldType` from the raw
prompt title. As a result, `创建 MarioWorld` was classified as `platformer`
but selected the sandbox template because the title did not contain
`platform`.

## Decision

`GameIntent` is authoritative in the integrated create-world path:

```text
Natural Language → IntentRouter → GameIntentExtractor
  → GameIntent → SemanticWorldGenerator → Game DSL → RuntimeProjection
```

`SemanticWorldGenerator.generate(model, intent?)` accepts an optional intent.
When supplied, the typed deterministic mapping is:

| GameGenre | WorldType |
| --- | --- |
| platformer | platformer |
| farm | farm |
| rpg | rpg |
| survival | survival |
| sandbox | sandbox |

The optional argument preserves compatibility for standalone callers, which
continue to use the existing title-based fallback. The primary pipeline does
not re-detect genre from raw prompt text.

## Consequences

- Mario input selects the existing platformer template without hardcoded Mario
  entities or renderer changes.
- Runtime, renderer, projection, and command executor contracts are unchanged.
- Intent extraction remains deterministic and rule-based; no LLM is involved.
- The title detector remains only as a legacy standalone fallback.

## Verification

Integration coverage verifies routing, platformer template entity roles,
RuntimeProjection output, PositionComponents, determinism, immutability, and
unknown-command compatibility.
