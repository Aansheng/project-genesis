# ADR-0254: Runtime Visual Geometry and Scale Contract

- Status: Accepted
- Date: 2026-08-19
- Work Order: WO-POST-S13-001
- Architecture Version: v1.139 → v1.140

## Context

Generated terrain and entity artwork is visual skin. Runtime positions and
collision geometry are authoritative, but the environment renderer previously
reconstructed terrain dimensions independently and applied a 1.5× visual
scale. Generated entity fitting also used the small legacy primitive envelopes
and centered character sprites on their Runtime position.

## Decision

- `DefaultEntityVisualCatalog` is the renderer-side visual envelope policy for
  semantic entity types, including readable world-space sizes and optional
  `feet` anchors for characters.
- `projectRenderBounds()` is the single renderer-neutral projection used by
  primitive entity rendering and generated terrain rendering.
- Terrain and platform resources are fitted to those projected world bounds;
  intrinsic image dimensions never define world size or collision geometry.
- Background remains viewport-space. Terrain and entities remain world-space
  and receive the existing camera transform.
- The existing Runtime collision pipeline and global `groundY = 400` contract
  remain unchanged. Collision does not inspect assets, textures, or Pixi
  objects.

## Consequences

Generated terrain occupies the same bounds as primitive terrain and follows
camera movement. Character sprites preserve a feet-to-position anchor and use
semantic envelopes independent of viewport dimensions or source image pixels.
Texture tiling/autotiling and richer per-entity collision bounds remain future
visual-quality work.

## Verification

- Runtime GroundCollision, repeated landing, and jump/re-land tests remain
  green.
- Renderer tests cover shared terrain/platform bounds, camera alignment,
  intrinsic image-size normalization, feet anchors, and semantic scale.
