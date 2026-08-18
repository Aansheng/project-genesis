# ADR-0237: Visual Design Specification Foundation

**Status:** Accepted  
**Work Order:** WO-S13-001  
**Architecture Version:** v1.124 → v1.125

## Context

`GameDesignSpecification` already preserves game theme and entity roles, but
the active world model and renderer do not consume them. The renderer currently
uses primitive, type-based fallback geometry. A separate semantic visual layer
is needed before assets or image generation can be introduced.

## Decision

Add the vendor- and renderer-independent `VisualDesignSpecification` contract
to `@genesis/shared`. It contains:

- `artDirection`: a small constrained vocabulary, currently `stylized-2d`,
  `pixel-art`, and `minimal-2d`;
- `theme`: the original `sourceTheme` plus a deterministic `visualTheme`
  refinement;
- `palette`: semantic temperature, contrast, and mood only;
- `environment`: terrain, background, and atmosphere descriptions;
- `entities`: the existing game-design entity IDs, categories, and a minimal
  `visualRole`.

`DefaultVisualDesignSpecificationBuilder` lives in `@genesis/ai` and compiles
the existing design specification deterministically. It deep-freezes output,
keeps stable IDs, and falls back to `classic-neutral` when no theme is given.

## Boundaries

The contract contains no RGB values, CSS, Pixi types, textures, URLs, asset
references, Runtime components, provider state, or generated files. The
Renderer and primitive `EntityVisualCatalog` are unchanged. Primitive geometry
therefore remains the current fallback until a later asset-resolution work
order supplies a resolved visual resource.

## Consequences

Theme and role semantics now have an explicit compilation boundary without
changing user-visible rendering or gameplay. `AssetManifest`, image
generation, asset loading, and Observatory integration remain deferred.
