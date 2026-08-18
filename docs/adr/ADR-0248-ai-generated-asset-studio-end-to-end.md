# ADR-0248: AI Generated Asset to Studio End-to-End

**Status:** Accepted  
**Date:** 2026-08-18  
**Work Order:** WO-S13-009  
**Architecture Version:** v1.133 → v1.134

## Decision

Studio creates the Runtime world and static/fallback AssetManifest first. A
server-independent browser orchestration then selects only the player
character, sends a vendor-neutral `ImageGenerationRequest` through
`POST /api/image-generation`, and applies a later immutable manifest snapshot
when generation succeeds.

The server publishes generated data URIs or provider-hosted image URLs into a
session-owned `InMemoryGeneratedAssetPublisher`. The renderer-facing resource
is `/api/generated-assets/{artifactId}.{extension}`; arbitrary `data:` URIs are not added
to the generic `AssetResolver` allowlist. Session artifacts disappear when the
AI server restarts and are not durable project assets.

The player asset is invalidated only in `AssetStore`, then resolved from the new
manifest. `PixiAssetAdapter` invalidates the changed asset's texture cache, so
the primitive/static player upgrades asynchronously without Runtime mutation or
world regeneration. Provider failure leaves the existing visual intact.

`codex-cli` remains an experimental local provider. DashScope, OpenAI, and
future providers use the same orchestration and publication boundary.
