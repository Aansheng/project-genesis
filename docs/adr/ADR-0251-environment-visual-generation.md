# ADR-0251 — Environment Visual Generation

## Status

Accepted

## Decision

- Environment requirements use the existing bounded scheduler, ordered
  background → terrain → character.
- `PixiEnvironmentRenderer` owns world-level background and terrain layers and
  never creates fake entity bindings.
- Background is viewport-space with deterministic `cover` fitting.
- Terrain is world-space and decorates existing `terrain`/`platform` bounds;
  Runtime geometry, collision, and physics remain authoritative.
- Unresolved, failed, or unavailable assets retain fallback visuals.

## Consequences

World creation remains immediate and environment results apply independently.
The first terrain implementation is one fitted texture per existing bound;
tiling, parallax, persistence, and animation remain future work.
