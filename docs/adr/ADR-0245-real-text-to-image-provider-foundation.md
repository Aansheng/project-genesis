# ADR-0245: Real Text-to-Image Provider Foundation

**Status:** Accepted  
**Date:** 2026-08-18  
**Work Order:** WO-S13-008  
**Architecture Version:** v1.131 → v1.132

## Context

WO-S13-007 established vendor-independent image-generation contracts. Genesis
now needs a real server-side text-to-image implementation without exposing
provider credentials or coupling image generation to the existing structured
game-design provider.

## Decision

`@genesis/ai-server` owns `OpenAIImageGenerationProvider`, which uses the
installed OpenAI SDK's `images.generate` boundary and accepts an injectable
transport for tests. It supports only `text-to-image`; image-to-image, edit,
and reference-guided requests return the shared `unsupported_mode` failure.

Image generation has a separate environment-only configuration:
`IMAGE_AI_PROVIDER`, `IMAGE_AI_API_KEY`, `IMAGE_AI_MODEL`,
`IMAGE_AI_BASE_URL`, `IMAGE_AI_TIMEOUT_MS`, and `IMAGE_AI_MAX_ATTEMPTS`.
The image model is intentionally independent from the game-design model.

The provider appends the request's global art direction, theme, palette, asset
kind, view, and transparency constraints to the semantic prompt. It normalizes
provider URLs or base64 payloads into `GeneratedImageAsset`, preserving asset
identity and safe metadata. It returns a completed `ImageGenerationOperation`
with status, semantic input facts, artifact metadata, or a safe failure; no
secrets, headers, provider payloads, or hidden reasoning are stored.

The first artifact strategy is a normalized provider URL or data URI. This is
adequate for local inspection, but provider URLs may expire. Persistent or
Genesis-owned artifact publication is deferred to WO-S13-009.

`POST /api/image-generation` is the server gateway. The browser client calls
only this route and never receives provider configuration. Normal Studio world
creation continues using StaticAssetCatalog and does not call the provider.

## Consequences

- Real text-to-image execution is available behind an injectable, testable
  server boundary.
- Image model configuration can evolve independently from text generation.
- Generated artifacts are not yet durable and are not automatically added to
  AssetManifest or rendered by Pixi.
