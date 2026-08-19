# ADR-0253 — Generalized Visual Asset Eligibility & Semantic Archetypes

## Status

Accepted

## Decision

Visual generation eligibility is based on meaningful semantic asset kinds:
`character`, renderable `prop`, `background`, and `terrain`. Checkpoint/goal
markers remain static-only, while icons remain deferred. Entity names survive
as an optional provider-independent `visualArchetype` on the visual and asset
specifications.

Generation grouping uses kind, archetype, subject, and visual context. Stable
entity-bound asset IDs remain unchanged; one grouped operation publishes one
resource and binds all grouped asset IDs/entity IDs. Runtime entities remain
independent.

## Consequences

NPCs, animals, enemy species, structures, and meaningful props can generate.
Repeated semantic entities share jobs, while distinct archetypes do not.
Static → primitive fallback, FIFO scheduling, environment ordering, partial
failure, and stale-world protection remain unchanged.
