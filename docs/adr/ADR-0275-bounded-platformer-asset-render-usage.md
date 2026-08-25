# ADR-0275 — Bounded Platformer Asset Render Usage

- Status: Accepted for Sprint 18 WO-S18-001
- Date: 2026-08-25
- Architecture: v1.160 → v1.161

## Context

Sprint 17 proved the mechanically complete platformer lifecycle. Sprint 18
real-scene measurement found that image generation and manifest consumers
received only generic `terrain`/`background` kind values. The existing prompt
policy therefore relied on kind-based wording, while later environment
rendering could not distinguish how an asset was intended to be composed.

`AssetRequirement` already represents semantic asset intent and the manifest is
already the resolution boundary. The smallest missing contract is a bounded
render-usage fact carried through those existing seams.

## Decision

Add optional provider-neutral `renderUsage` metadata to the existing asset
requirement, image-generation request/context, manifest, and operation
contracts. The current builder emits only these usages:

- `entity-sprite`
- `background-cover`
- `ground-repeat-x`

The Web prompt policy derives deterministic constraints from the usage. Usage
participates in visual identity/grouping and is preserved in the manifest for a
later Renderer composition slice.

This vocabulary is intentionally bounded to the roles currently emitted by
the platformer asset specification. It is not a universal visual taxonomy;
local platform usage must be introduced only if the next product measurement
selects it.

## Authority and Boundaries

- Semantic asset requirements remain structured data.
- AI/provider output remains a candidate and never defines usage authority.
- Runtime geometry remains gameplay/layout authority.
- Renderer consumes usage and Runtime projections; image pixels, dimensions,
  and alpha do not define collision or layout.
- Web/Observatory remain projections; no new visual manager or framework is
  introduced.

## Consequences

- Background requests explicitly constrain distant scenery without playable
  foreground terrain.
- Ground requests explicitly constrain repeatable ground material without sky
  or environmental scenery.
- Entity requests explicitly remain isolated sprites.
- Different usages cannot be silently merged by deterministic visual identity.
- Local platform composition and Runtime-geometry-backed repetition remain
  measured follow-on work rather than speculative infrastructure.

## Rejected Alternatives

- Hardcoded prompt-only strings without a semantic usage field: rejected because
  the same missing fact would remain unavailable to the manifest and Renderer.
- Inferring usage from image pixels or alpha: rejected because Runtime geometry
  must remain authoritative.
- A universal visual-role engine, TerrainManager, tileset/editor, or broad
  Renderer rewrite: rejected as unmeasured Sprint 18 infrastructure.
