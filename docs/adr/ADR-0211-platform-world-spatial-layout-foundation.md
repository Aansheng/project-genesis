# ADR-0211: Platform World Spatial Layout Foundation

- Status: Accepted
- Date: 2026-08-17
- Work Order: WO-S10-009

## Context

Generated worlds had PositionComponents, but the semantic DSL builder assigned
every entity the same `(100, 100)` position. This made the platformer template
render as overlapping shapes.

## Decision

Introduce a pure `WorldLayoutGenerator` in the AI game-world layer. The default
generator maps the current platformer template ids to deterministic positions
and assigns non-platformer and unknown ids a deterministic horizontal fallback.
`DefaultSemanticGameDslBuilder` accepts the generator as an optional dependency
and converts its output into the existing PositionComponent representation.

The Runtime and Renderer remain consumers of projected position data; no
renderer-specific coordinate rules are added.

## Consequences

- Platformer entities are spatially separated before projection.
- Farm, RPG, survival, sandbox, empty, large, and custom worlds remain supported.
- Existing `build(world)` callers remain source-compatible.
- Future layout policies can be injected without changing the DSL or Runtime.

## Verification

Deterministic layout, frozen outputs, generic fallback, DSL integration, Runtime
projection, renderer adaptation, and browser rendering were covered by tests and
manual verification of `创建 MarioWorld`.
