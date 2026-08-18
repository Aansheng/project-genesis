# ADR-0250: Multi-Asset Generation Orchestration

**Status:** Accepted  
**Date:** 2026-08-18  
**Work Order:** WO-S13-011  
**Architecture Version:** v1.135 → v1.136

## Decision

Studio schedules one provider-neutral job per canonical visual identity for
player, enemy, and boss character requirements. Semantic duplicates share one
request while retaining their original AssetSpecification IDs and entity
bindings. A FIFO browser scheduler defaults to one concurrent request.

Each job owns an ImageGenerationOperation in a collection. Results update the
latest immutable AssetManifest snapshot and invalidate only changed IDs, so
Sprites upgrade independently. Failed jobs retain fallback visuals. A new
world drains queued jobs and a world token suppresses stale running results.

Checkpoint, terrain, background, image-to-image, persistence, adaptive
concurrency, and generic DAG execution remain out of scope.
