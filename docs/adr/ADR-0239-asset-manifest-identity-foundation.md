# ADR-0239: Asset Manifest & Asset Identity Foundation

**Status:** Accepted  
**Work Order:** WO-S13-003  
**Architecture Version:** v1.126 → v1.127

## Context

`AssetSpecification` describes required visual assets, but the repository had
no domain representation for resolved resources or partial resolution. The
Renderer still uses primitive geometry and must remain unchanged.

## Decision

Add the shared, immutable `AssetManifest` contract and
`DefaultAssetManifestBuilder` to `@genesis/shared`. The manifest contains one
entry for every `AssetSpecification.assets` requirement. The existing
requirement `id` is reused as the canonical `assetId`; no second
`requirementId` is introduced for the current one-to-one model.

Entries preserve kind, target, and entity binding and use explicit
`unresolved`, `resolved`, or `failed` status. Resolved entries may contain only
an opaque URI reference, optional lightweight MIME/dimension metadata, and a
vendor-neutral origin (`static`, `generated`, `uploaded`, or `fallback`).

The builder accepts an optional in-memory resolution mapping. It performs no
filesystem or network lookup, includes unresolved requirements, supports
partial resolution, rejects invalid resource/status combinations, and returns
a deeply frozen snapshot.

## Deferred decisions

Asset state variants are not expanded into separate manifest entries; one
primary asset identity remains associated with each requirement. State/frame
manifest design, AssetResolver, AssetStore, caching, persistence, and asset
deduplication are deferred to S13-004 or later.

## Consequences

Future resolution can follow `AssetSpecification → AssetResolver →
AssetManifest`, and future rendering can use resolved entries while retaining
primitive fallback for unresolved/failed entries. No Pixi, Runtime, Web,
filesystem, image, or provider dependency is introduced.
