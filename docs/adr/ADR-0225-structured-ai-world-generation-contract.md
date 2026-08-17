# ADR-0225: Structured AI World Generation Contract

**Status:** Accepted  
**Work Order:** WO-S12-002  
**Architecture Version:** v1.111 → v1.112

## Decision

AI world providers return a serializable semantic `GameWorldGenerationCandidate`.
`DefaultGameWorldValidator` validates world type, entity shape, supported
categories, non-empty identifiers/names, and identifier uniqueness before
converting the candidate to `GameWorldModel`.

`GameWorldGenerationProviderAdapter` is the validated model-returning port used
by the existing async create-world pipeline. The deterministic provider uses the
same candidate and validation path.

## Boundaries

The candidate contains no coordinates, DSL, Runtime entities, components, Pixi
objects, prompts, tokens, or provider-specific transport data. The existing
`GameWorldModel → SemanticGameDslBuilder → RuntimeProjection` path is unchanged.

No real LLM provider is introduced by this decision.
