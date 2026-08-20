# ADR-0260 — Targeted Visual Asset Execution & Incremental Synchronization

- Status: Accepted
- Date: 2026-08-20
- Work Order: WO-S14-005
- Architecture: v1.145 → v1.146

## Context

WO-S14-004 produces an immutable `AssetImpactPlan` and an exact canonical
`generationRequired` set, but intentionally stops before provider execution.
The next step must make a visual evolution visible without rebuilding the
semantic world, Runtime world, camera, player, or renderer containers.

The existing browser path already owns the required seams:
`BrowserImageGenerationClient`, `VisualAssetGenerationScheduler`,
`AssetManifest`, `DefaultAssetStore`, and the Pixi entity/environment renderers.
Creating a second provider, scheduler, or renderer application path would
duplicate lifecycle truth and make shared bindings unsafe.

## Decision

Add `VisualAssetEvolutionExecutor` in the web asset-policy boundary. It accepts
the S14-004 `VisualEvolutionPlan`, current `AssetManifest`, and world/session
execution context. It never rescans Runtime or recomputes visual impact.

For each canonical requirement it builds one request from the updated visual
specification, reuses the existing FIFO scheduler and browser image client,
validates the returned canonical artifact, resolves only the affected bindings,
then commits a targeted manifest update. Cow ×3 → Sheep therefore performs one
Sheep request and binds one generated URI to the three stable cow asset IDs.
Unrelated manifest entry objects are preserved by identity. Removed IDs are
invalidated only when no current specification binding remains; partial shared
removal leaves the remaining IDs and resource active.

Generation is off-to-side. The previous resource or primitive fallback remains
visible while queued, generating, resolving, and applying. A provider,
artifact, resolution, renderer, stale-token, or superseded-world failure keeps
the previous manifest/visual active and records a safe fallback fact; semantic
and Runtime state are not rolled back. A new world or newer semantic/visual
revision rejects late results. Repeated operation IDs return the existing
result without creating another job or binding.

The existing renderer seam receives the new manifest through
`setAssetManifest`. URI changes invalidate only affected Pixi adapter keys;
the existing Runtime visualization loop keeps positions, physics, camera, and
unrelated display state authoritative. No whole-container renderer recreation
or Runtime mutation is introduced.

## Lifecycle and observability

Execution facts use the following stages:

`ASSET_EXECUTION_STARTED` → `ASSET_GENERATION_STARTED` → `ASSET_GENERATED` →
`MANIFEST_REBOUND` → `ASSET_RESOLVED` → `RENDERER_APPLIED` →
`VISUAL_SYNC_COMPLETED`.

Remove-only changes use execution start → manifest rebound → visual sync
completed and never emit a fake generation stage. Failures emit
`VISUAL_SYNC_FAILED`; stale and already-synced outcomes remain explicit.
History, Diff, Timeline, Trace, Event Stream, and Generation Trace expose
operation/world/revision facts, canonical counts, targeted bindings, manifest
revision, renderer-applied entities, and previous-visual retention. Provider
secrets and raw payloads remain outside the UI model.

## Non-goals

This decision does not add durable generated-asset persistence, binary decode
or optimization, animation, undo/redo, batch prompt planning, priority
scheduling, provider selection, Runtime/camera changes, or a full visual
rebuild. Generated URIs remain session-owned gateway artifacts until a later
work order proves durable storage is the actual bottleneck.

## Consequences

- Shared visual changes are bounded by canonical generation count rather than
  entity count.
- Failure and supersession are visible without blanking or semantically
  rolling back the world.
- AssetManifest/AssetStore/Pixi state converges incrementally while unrelated
  resources remain untouched.
- A future durable asset lifecycle can replace only the publication/storage
  seam without changing semantic planning or Runtime synchronization.
