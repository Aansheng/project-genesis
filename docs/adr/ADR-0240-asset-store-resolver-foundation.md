# ADR-0240: Asset Store & Resolver Foundation

**Status:** Accepted  
**Work Order:** WO-S13-004  
**Architecture Version:** v1.127 → v1.128

## Context

The immutable `AssetManifest` describes resource state, but Genesis had no
runtime boundary for looking up manifest entries, resolving neutral resources,
or caching successful results. The repository has no reusable asset loader or
cache abstraction. Renderer already owns Pixi, so placing this logic there
would couple the core asset path to rendering.

## Decision

Create `@genesis/assets`, a small package depending only on
`@genesis/shared`. It contains:

- `DefaultAssetResolver`, which is manifest-aware and returns structured
  resolved, unavailable, or failed results;
- `AssetResourceLoader`, an injectable transport boundary;
- `PassthroughAssetResourceLoader`, which supports static URI resolution
  without fetching or decoding bytes;
- `DefaultAssetStore`, a mutable in-memory cache for successful neutral
  resource descriptors.

The neutral resource preserves canonical asset ID, kind, target, entity ID,
URI, and safe metadata. It contains no Pixi, DOM, Blob, Image, Canvas, WebGL,
provider, or secret data.

## Policies

Supported URI schemes are relative/static paths and public `http`/`https`
references. `asset://`, `file://`, and `data:` are rejected until a dedicated
adapter exists. HTTP references are treated as public; authenticated delivery
and signed URL policy are deferred.

The store caches successful results only, shares concurrent requests by
canonical asset ID, does not cache failures, and exposes `invalidate` and
`clear`. The manifest is never mutated. Renderer integration will later adapt
`ResolvedAssetResource` to `PIXI.Texture`; this WO does not implement that
adapter.
