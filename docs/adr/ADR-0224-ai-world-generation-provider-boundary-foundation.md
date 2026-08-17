# ADR-0224: AI World Generation Provider Boundary Foundation

**Status:** Accepted  
**Work Order:** WO-S12-001  
**Architecture Version:** v1.110 → v1.111

## Decision

Add `GameWorldGenerationProvider` under `@genesis/ai/game-world/generation/`.
It accepts a typed `{ input, intent }` request and asynchronously returns the
existing `GameWorldModel`. `DeterministicGameWorldGenerationProvider` adapts the
current rule/template generator as the fallback.

The existing synchronous `CreateWorldPipeline.execute()` remains unchanged for
compatibility. `DefaultCreateWorldPipeline.executeAsync()` is the provider
integration point and continues through the existing DSL builder and projection.
Runtime, Renderer, Pixi, and Web UI remain outside the provider boundary.

## Async decision

Option B: introduce the async provider path separately while preserving the
verified synchronous path. This avoids changing Runtime/Renderer APIs and keeps
current consumers working; S12-002 can select an LLM provider through the same
async port.

## Current behavior

`创建 MarioWorld` still uses deterministic keyword extraction, fixed semantic
templates, and deterministic layout. No real LLM is called.
