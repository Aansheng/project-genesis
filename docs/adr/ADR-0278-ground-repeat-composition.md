# ADR-0278 — Tile Ground Material Across the Runtime-Authoritative Ground Plane

- Status: Accepted and Product Verified
- Date: 2026-08-25
- Sprint: Sprint 18
- Work Order: WO-S18-004 — Ground-Repeat Composition Across the Authoritative Ground Plane
- Architecture: v1.163 → v1.164

## Context

The resumed real Studio platformer run closed the Platform asset-evidence gate,
but direct product observation exposed a separate Ground composition defect:
the player could move across the continuous Runtime ground plane while the
generated terrain material was rendered only as a small rectangle near its
source position.

Measurement established that this is not a Runtime-width defect. The primary
`ground` entity has semantic name `Ground`, Runtime position `(160, 400)`, and
no finite collision-bounds component. `DefaultGroundCollisionSystem` owns the
authoritative horizontal ground plane at `groundY = 400`; it is intentionally
walkable across X. The RenderEntity likewise projects the semantic name and
position but no finite dimensions. Before this decision, the Renderer derived
a single `64 × 32` terrain-catalog rectangle, which visibly contradicted the
Runtime-authoritative surface.

The resolved material is `terrain-main`, carrying the existing
`ground-repeat-x` usage. The real generated Terrain texture measured
`2172 × 724` pixels. It is a material skin, not a source of gameplay geometry.

## Decision

Within the existing `PixiEnvironmentRenderer` environment-material path only:

- recognize `ground-repeat-x` on a non-Platform surface;
- render that material as a Pixi `TilingSprite` over the current
  camera-visible interval of the existing Runtime ground plane;
- scale tiles uniformly to the existing terrain visual height, clip them to
  that visible interval, and recompute the interval during normal render;
- retain ordinary bounded `Sprite` composition for Platform and legacy terrain
  paths.

The Runtime ground plane, collision system, entity positions, catalog bounds,
and Platform-specific selection contract are unchanged. No world-width image,
tilemap, tileset manager, image-based collision, or new visual ontology is
introduced.

## Consequences

- Visible Ground coverage follows the Runtime-authoritative continuous
  walkable surface without inventing collision geometry from texture pixels.
- The generated Ground material repeats horizontally only; it does not stretch
  or crop a single world-width image.
- Platform remains a local bounded visual selected by its semantic Platform
  identity and does not consume the Ground material path.
- Existing legacy/non-repeat terrain behavior remains a bounded sprite.

## Rejected Alternatives

- Widening Runtime Ground geometry would hide no measured Runtime defect and
  would change collision authority merely to accommodate a texture.
- Stretching one generated texture over a world-width rectangle would distort
  the material and violate the existing `ground-repeat-x` intent.
- A tilemap, tileset manager, terrain manager, or world-width generated PNG
  expands architecture beyond this single Renderer-consumption defect.

## Verification

Focused Renderer regression verifies that `ground-repeat-x` creates one
camera-visible tiling surface while the Platform remains at its existing
`96 × 24` local bounds. Real Studio verification shows Background cover,
continuous Ground coverage, a local Platform asset lifecycle, independent
entity sprites, working movement/jump, unchanged Runtime authority, and no
browser warning/error diagnostics.
