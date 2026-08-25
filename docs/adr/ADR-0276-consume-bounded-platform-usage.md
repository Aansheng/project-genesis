# ADR-0276 — Consume Bounded Platform Usage in Environment Composition

- Status: Accepted
- Date: 2026-08-25
- Sprint: Sprint 18
- Work Order: WO-S18-002
- Architecture: v1.161 → v1.162

## Context

WO-S18-001 made the current platformer asset path truthful about three bounded
render usages: `entity-sprite`, `background-cover`, and `ground-repeat-x`.
The first real post-WO measurement found that the environment Renderer still
selected the first resolved environment `terrain` asset for both `terrain` and
`platform` entities. The existing exact platform entity-sprite requirement was
therefore generated but hidden whenever a ground material was available.

## Decision

`PixiEnvironmentRenderer` consumes the existing manifest usage facts:

- `terrain` entities prefer the resolved environment `ground-repeat-x` entry,
  with the pre-v1.161 resolved `kind: terrain` entry as a compatibility
  fallback.
- `platform` entities prefer a resolved entity entry whose `entityId` matches
  the Runtime entity and whose usage is `entity-sprite`. A legacy entity entry
  without usage is also accepted. If no exact platform entry exists, the
  resolved ground material remains the safe fallback.
- Background selection prefers `background-cover`, with the existing
  background-kind fallback.

The Renderer still uses Runtime-projected position and the existing visual
catalog bounds. Generated images remain skins/materials and do not define
collision, layout, or geometry.

## Consequences

- The current platformer path now consumes the role contract at the existing
  Renderer boundary without introducing a manager or a universal visual
  taxonomy.
- Older manifests remain renderable through deterministic kind/target fallbacks.
- Repeated/tiled ground composition and authoritative Runtime collision bounds
  are still separate measured candidates; this ADR does not authorize them.

## Rejected Alternatives

- Adding a `PlatformManager`, `VisualAssetManager`, or universal role engine
  would exceed the measured blocker.
- Inferring platform or collision geometry from image pixels would violate the
  Runtime-authority invariant.
- Adding tiling, spritesheets, animation, or a new Runtime geometry contract
  would broaden this bounded consumer slice.
