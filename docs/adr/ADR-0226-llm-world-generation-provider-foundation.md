# ADR-0226: LLM World Generation Provider Boundary Foundation

**Status:** Accepted  
**Work Order:** WO-S12-003  
**Architecture Version:** v1.112 → v1.113

## Decision

Add `StructuredGenerationClient` and `LLMGameWorldGenerationCandidateProvider`
under `@genesis/ai/game-world/generation/`. The model client receives the
typed generation request and returns `unknown`; the LLM provider only parses a
string response and never creates a `GameWorldModel`, DSL, Runtime entity,
component, renderer data, or code.

The existing `GameWorldGenerationProviderAdapter` and
`DefaultGameWorldValidator` remain the authoritative trust boundary. A
`FallbackGameWorldGenerationProvider` calls the existing deterministic provider
when the LLM call, parsing, or candidate validation fails.

## Configuration and scope

No vendor SDK, API key, network call, streaming, token tracking, prompt
optimization, coordinates, asset generation, persistence, or multiplayer is
introduced. A real model is optional and is supplied through dependency
injection as a `StructuredGenerationClient`; tests use fake clients.

## Runtime flow

`GameIntent` + original input → model client → unknown structured response →
candidate provider → existing validator → `GameWorldModel` → existing DSL →
Runtime projection. Invalid LLM output follows the same path with the
deterministic platformer fallback.
