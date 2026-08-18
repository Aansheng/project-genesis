# ADR-0249: Visual Generation Activity & Execution Trace

**Status:** Accepted  
**Date:** 2026-08-18  
**Work Order:** WO-S13-010  
**Architecture Version:** v1.134 → v1.135

## Context

WO-S13-009 connected asynchronous player artwork generation to the playable
Studio world, but the UI treated provider completion as final success. Asset
publication, manifest replacement, resolution, and Pixi Sprite application were
not represented as one user-safe operation.

## Decision

Extend the existing `ImageGenerationOperation` instead of creating a second
tracing system. The browser keeps one correlation ID for the current player
operation and records high-level stages: preparing, generating, applying, ready,
or fallback. Artifact publication is represented by `artifactStatus: published`;
the current synchronous image gateway does not expose a mid-request publishing
event, so no artificial publishing progress is shown.

The renderer reports `applied` or sanitized `failed` events through an injected
callback. Only that renderer event can move the operation to `ready` and
`generated_and_applied`. Provider, publication, resolution, and renderer
failures retain the playable world and report fallback separately.

Studio Activity and the existing Observatory Generation panel consume the same
Pinia operation state. Full Observatory may show a Genesis-owned artifact
thumbnail, but never data URIs, provider temporary URLs, secrets, or hidden
reasoning.

## Consequences

- World readiness and visual enrichment readiness remain independent.
- The current single-player orchestration remains intentionally small.
- A future streaming/polling gateway can add a truthful publishing stage without
  changing the UI state ownership.
- No multi-asset generation, persistence, DAG engine, or operation history is
  introduced.
