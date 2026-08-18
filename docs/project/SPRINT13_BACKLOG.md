# Sprint 13 Backlog — Visual & Asset Generation

Sprint 13 should move the product from primitive geometry toward authored or
generated 2D visuals. WO-S13-001 establishes the semantic visual layer; asset
specification and realization remain future work.

## Architectural Principle

`GameDesignSpecification → VisualDesignSpecification → AssetManifest →
Asset Resolution / Generation → Renderer`

Keep separate: GameDesign (what exists), VisualDesign (how it looks), GameUI
(HUD/menu structure), Runtime (behavior), and Renderer (drawing resolved
visuals).

## Candidate Work Streams

1. Define the smallest `VisualDesignSpecification` for theme, palette, entity
   visual roles, terrain treatment, and background layers.
2. Define stable asset identity and an `AssetManifest` without coupling AI to
   Pixi or storage.
3. Add deterministic fallback visuals for every manifest entry.
4. Add asset resolution, loading, cache, and lifecycle ownership.
5. Bind entity semantic roles to resolved sprites, tiles, and backgrounds.
6. Compile platform terrain and theme choices into tileset/background visuals.
7. Establish the future AI image/asset-generation boundary behind the manifest.
8. Defer HUD/UI specification until the world visual boundary is stable.

## Minimum Sequence

1. VisualDesignSpecification and capability boundary
2. AssetManifest and deterministic fallback assets
3. Renderer asset resolution and entity visual binding
4. Terrain/background layers
5. Optional AI asset generation and cache policy

Missing assets must still render deterministic fallback geometry, and GameDesign
must remain usable without an asset provider.

## Completed

- WO-S13-001: vendor-independent `VisualDesignSpecification`, deterministic
  GameDesign → VisualDesign compilation, visual capability matrix, and ADR-0237.
