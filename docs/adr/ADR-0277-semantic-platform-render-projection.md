# ADR-0277 — Preserve Semantic Platform Identity in the Render Projection

- Status: Accepted bounded repair; Product Verification pending provider-backed platform evidence
- Date: 2026-08-25
- Sprint: Sprint 18
- Work Order: WO-S18-003 — Ground-Repeat Composition Measurement
- Architecture: v1.162 → v1.163

## Context

The first real image-backed Studio run exposed a mismatch in the previously
verified platform selection path. The deterministic platformer baseline keeps
both `Terrain` and `Platform` as Runtime entities with `type: terrain`; their
semantic components distinguish the names. `DefaultRuntimeRendererAdapter`
previously discarded that semantic name, so `PixiEnvironmentRenderer` could
not recognize the platform surface. It selected `terrain-main` for both
surfaces and also used the terrain catalog bounds for the platform.

This was measured in the existing production path. It is not a request for a
new Runtime role system or a new visual taxonomy.

## Decision

Carry the optional `semantic.name` fact into the existing `RenderEntity` model
as `semanticName`, without exposing Runtime components or changing Runtime
entity type, collision, layout, or session authority.

Within `PixiEnvironmentRenderer` only:

- the current bounded platform surface is recognized from the existing
  `Platform` semantic name; the legacy `type: platform` projection remains
  compatible;
- a resolved matching `entity-sprite` remains preferred for that surface;
- the existing `platform` visual-catalog bounds are used for the projection;
- if the exact platform resource is unavailable, the existing resolved ground
  material remains the safe fallback;
- async environment application is committed only for the current entity
  target and current manifest resource URI, preserving stale-world/resource
  isolation.

Runtime position and collision geometry remain authoritative. Generated image
pixels remain visual skins/materials. Web and Observatory continue to report
the provider and fallback outcome rather than treating a provider timeout as a
successful platform asset.

## Consequences

- The actual baseline semantic distinction reaches the existing Renderer
  projection with one optional field and no manager/framework layer.
- Local platform selection and geometry are now source-correct when a matching
  resolved platform asset exists.
- Ground-repeat/tiling remains unimplemented until a wider Runtime geometry
  measurement proves it is required.
- Product Verification remains pending until a real provider-backed platform
  asset resolves and is applied; the current run timed out at the provider
  boundary and must not be counted as that proof.

## Rejected Alternatives

- Changing Runtime `Entity.type` to `platform` would alter the existing
  category/type contract and is unnecessary.
- A `PlatformManager`, universal visual-role ontology, image-pixel geometry,
  or Runtime geometry/collision change would exceed the measured blocker.
- Retrying provider generation in a loop would hide the provider failure and
  violate the bounded fallback semantics.
