# ADR-0261 — Capability-Specific Generation Context Foundation

- Status: Accepted
- Date: 2026-08-21
- Work Order: WO-S15-000
- Architecture: v1.146 → v1.147

## Context

Project Genesis has several generation capabilities with different context
needs. Reusing a broad conversation or world snapshot makes prompts noisy and
can cause a provider to mistake stable asset bindings, renderer state, or old
history for current semantic truth. The existing Sprint 14 semantic, Runtime,
visual, AssetSpecification, and stale-revision seams are already authoritative;
this work order must improve context assembly without adding another store or
orchestration layer.

## Decision

Add provider-neutral, immutable contracts and builders in
`@genesis/shared`:

- `WorldEvolutionGenerationContext` contains the current world type,
  properties, current entity IDs/names/categories, a real selected entity when
  present, supported operations, and semantic/Runtime/visual revisions.
- `ImageGenerationContext` contains only the current world/theme facts relevant
  to the target, the current visual specification, the target
  AssetSpecification facts, canonical bindings, and at most three deterministic
  metadata-only neighboring requirements. It never carries resource URIs,
  image bytes, provider payloads, or inferred style fields.
- `GameDesignGenerationContext` contains the existing create request and
  capability/default constraints. It does not require an existing world.
- `GameplayGenerationContext<T>` is a typed extension point only. No gameplay
  specification or gameplay builder is introduced by this ADR.

The authority flow is:

`current authoritative state → capability builder → immutable minimum context → deterministic prompt/provider assembly`.

World evolution re-derives its context from the request's current semantic
world when assembling a prompt; a transported derived context is metadata and
never a second authority. Image generation is integrated at the existing
`AssetGenerationPolicy` / `VisualAssetEvolutionExecutor` seams. Initial
generation and evolution requests now carry the image context through the
existing BrowserImageGenerationClient and retain the current ID bindings even
when the semantic archetype changes (for example `cow-*` IDs with `Sheep`
current names).

Prompt assembly uses stable sections (`GAME CONTEXT`, `VISUAL CONTEXT`,
`TARGET ASSET`, `CONSTRAINTS`) and remains vendor-neutral. Providers continue
to receive only their existing request boundary. Observatory exposes bounded
context scope, world, revisions, target archetype, binding count, and reference
metadata count; it does not expose secrets, raw provider events, hidden
reasoning, URIs, or binary data.

## Revision and immutability rules

Builders copy and freeze nested snapshots. Context metadata records the
semantic, Runtime semantic, and visual revisions relevant to the capability.
Existing world/session, semantic, visual, token, and manifest stale guards stay
authoritative; image execution additionally rejects a Runtime revision that no
longer matches the current session.

## Non-goals

This ADR does not add conversation memory, global history, RAG, a vector
database, a Context Store, a generic ContextManager, a second orchestration
layer, provider-specific contracts, fake similarity transport, durable asset
storage, gameplay mechanics, or a gameplay specification.

## Consequences

- World evolution prompts are smaller and can only target entities that exist
  in the current semantic snapshot.
- Image prompts describe the current visual target while preserving stable
  bindings and bounded metadata-only continuity hints.
- Context facts are testable independently and safe to inspect in Observatory.
- Future gameplay generation has a clear typed boundary without committing the
  product to a premature mechanics schema.
- Conversation continuity, richer reference-guided image generation, context
  caching, and durable persistence remain explicit follow-up work.
