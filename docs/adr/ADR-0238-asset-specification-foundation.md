# ADR-0238: Asset Specification Foundation

**Status:** Accepted  
**Work Order:** WO-S13-002  
**Architecture Version:** v1.125 → v1.126

## Context

S13-001 introduced semantic visual intent, but Genesis had no contract for
which visual resources that intent requires. The current Renderer only uses
primitive geometry selected by entity type; it has no asset references,
textures, or animation runtime.

## Decision

Add the vendor-independent `AssetSpecification` contract to `@genesis/shared`.
It contains shared `visualContext` and ordered `AssetRequirement` entries.
Each requirement has a stable ID, kind, target, semantic subject, optional
entity binding, visual role, required visual states, and only the minimal
technical profile needed for future 2D generation (`transparentBackground` and
`view`).

The initial kinds are `character`, `terrain`, `background`, `prop`, and
`icon`. Tilesets are deferred until a tile slicing/metadata consumer exists.
The deterministic `DefaultAssetSpecificationBuilder` lives in `@genesis/ai`.
It creates one requirement per visual entity plus terrain and background
requirements, preserving entity IDs and global art direction/theme/palette.

## State and reuse policy

The player requires `idle`, `run`, and `jump` visual states because those are
the current gameplay-visible states. Non-player characters require only
`idle`; this is a requirement declaration, not an animation state machine.
Two entities with the same visual role receive separate requirements. Asset
deduplication is deferred to the future manifest/resolver layer.

## Boundaries

`AssetSpecification` describes what is needed. It does not contain URLs,
files, textures, dimensions, sprite sheets, generated data, Runtime values,
Pixi types, or provider state. `AssetManifest` will later describe what was
actually resolved/generated. Primitive `EntityVisualCatalog` fallback remains
unchanged and continues to be the current rendered behavior.
