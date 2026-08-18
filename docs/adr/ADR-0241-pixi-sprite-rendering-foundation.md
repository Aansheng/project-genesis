# ADR-0241: Pixi Sprite Rendering Foundation

**Status:** Accepted  
**Work Order:** WO-S13-005  
**Architecture Version:** v1.128 → v1.129

`@genesis/renderer` optionally consumes an `AssetManifest` and injected
`AssetStore`. It binds `RenderEntity.id` to `entityId`, resolves the canonical
`assetId`, and adapts `ResolvedAssetResource` through a renderer-owned
`PixiAssetAdapter`.

Entities begin as existing primitive Graphics. A successful asynchronous
texture load replaces the primitive with a Sprite; unresolved, failed, or
missing resources keep the primitive visible. Texture promises are cached by
asset ID in the Pixi adapter, while AssetStore owns neutral resource caching.
Sprites use center anchoring and contain within existing visual bounds;
Runtime geometry is unchanged. Production manifest wiring, backgrounds,
tilesets, and animation remain deferred.
