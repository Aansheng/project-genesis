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
- WO-S13-002: vendor-independent `AssetSpecification`, deterministic
  VisualDesign → Asset compilation, stable entity-bound asset IDs, and ADR-0238.
- WO-S13-003: immutable `AssetManifest`, canonical asset identity, partial
  resolution states, static resolution fixtures, and ADR-0239.
- WO-S13-004: isolated `@genesis/assets` resolver/store package with injectable
  loading, static URI support, successful-resolution caching, and ADR-0240.
- WO-S13-005: renderer-owned Pixi texture adapter, entity sprite binding,
  asynchronous primitive-to-sprite upgrade, and ADR-0241.
- WO-S13-006: wired repository-owned static player/enemy/boss/checkpoint
  fixtures through Studio generation, AssetManifest, AssetStore, and Pixi;
  added ADR-0242.
- WO-S13-006B: added browser request timeout recovery, preserved deterministic
  fallback, fixed duplicate Pixi Graphics destruction after Sprite upgrade,
  and product-verified the unavailable-provider Studio path; added ADR-0243.
- WO-S13-007: added the vendor-independent image-generation request, result,
  provider, capability, failure, and observable operation contracts; no real
  provider or Studio wiring was added.
- WO-S13-008: added the server-side text-to-image provider, image gateway,
  separate `IMAGE_AI_*` configuration, browser gateway client, normalization,
  bounded reliability, and safe operation results; no AssetManifest wiring.
- WO-S13-008B: added the native DashScope Qwen Image text-to-image adapter,
  explicit server-side provider selection, normalized temporary PNG results,
  and truthful non-transparency capability documentation; no AssetManifest or
  Pixi wiring.
- Codex CLI image service prototype: added an experimental local CLI provider
  behind the existing image-generation gateway; no production stability or
  AssetManifest/Pixi wiring is claimed.
- WO-S13-009: connected player-only AI generation to Studio asynchronously,
  added session-owned artifact publication, immutable manifest replacement,
  targeted AssetStore invalidation, and Pixi visual upgrade; no persistence or
  multi-asset generation.
- WO-S13-010: added structured visual-generation activity and execution facts,
  preserved operation correlation through renderer application, separated world
  readiness from visual enrichment, and extended the existing Observatory
  Generation panel; no generic tracing engine or multi-asset orchestration.
- WO-S13-010B: verified the real browser terminal fallback through a controlled
  Codex CLI timeout, preserved typed HTTP failure details, bounded CLI child
  termination, and retained stale-result protection; successful real-CLI READY
  verification remains environment-dependent.
- WO-S13-011: added canonical player/enemy/boss multi-asset orchestration,
  FIFO bounded concurrency, partial success, incremental manifest/Pixi updates,
  and stale-world suppression; added ADR-0250.
- WO-S13-012B: fixed FIFO progression after rejected/terminal jobs by keeping
  queued state outside the job body and releasing capacity through the existing
  finally path; environment activity now derives Background/Terrain labels and
  omits non-applicable entity bindings. Final browser verification passed for
  FIFO progression, terminal continuation, metadata, gameplay, and stale-world
  suppression; Code Complete = YES, Product Verified = YES.
- WO-S13-013: generalized generation eligibility to meaningful semantic
  characters and props, added deterministic visual archetypes, deduplicated
  repeated semantic entities before FIFO enqueue, and exposed shared binding
  IDs in visual operations; added ADR-0253. Sprint 13 implementation is now
  frozen; Sprint 14 should target natural-language world evolution.
