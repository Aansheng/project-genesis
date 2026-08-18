# ADR-0242: Static Asset End-to-End Production Wiring

**Status:** Accepted  
**Work Order:** WO-S13-006  
**Architecture Version:** v1.129 → v1.130

The Studio session owns one long-lived `DefaultAssetStore` and replaces its
immutable `AssetManifest` when a world is generated. The Web composition layer
compiles the generation diagnostic `GameDesignSpecification` through the
existing visual and asset specification builders, then resolves only mapped
repository fixtures with `origin: static`.

Static mapping is kept outside Pixi renderer code. Player, enemy, boss, and
checkpoint semantic requirements map to `/assets/genesis/*.png`; unsupported
requirements remain unresolved and use primitive rendering. The existing
`RenderEntity.id → AssetManifest.entityId` binding is reused, so multiple
entities can share a fixture without array-index coupling.

The stable AssetStore is reused across world replacement. Renderer receives the
current manifest through its injected composition path and clears renderer
views on unmount; Runtime geometry and gameplay systems remain unchanged.
Terrain, background, animation, and image generation remain deferred.
