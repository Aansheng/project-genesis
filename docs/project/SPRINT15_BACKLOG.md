# Sprint 15 Backlog — Capability-Specific Generation Context

Sprint 15 begins by making generation context capability-specific while keeping
the Sprint 14 semantic world and Runtime paths authoritative. The product
pipeline remains:

`Natural Language → Intent → Semantic World → capability context → Game DSL → Runtime → Renderer → playable game`

## Architectural boundary

`current authoritative state → context builder → immutable minimum context → prompt/provider`

No global memory/history/RAG/vector store, generic context manager, second
orchestration layer, or context store is introduced. Stable entity IDs remain
bindings and current semantic names remain the source of visual archetype truth.

## Completed

### WO-S15-000 — Capability-Specific Generation Context Foundation

- Added shared immutable contracts and builders for world evolution, image
  generation, and game design; added a typed gameplay extension point without a
  gameplay specification.
- Connected world evolution prompt assembly to current semantic snapshots and
  preserved existing stale guards and operation correlation.
- Connected image generation at initial creation and visual evolution. Image
  requests now include current semantic/visual facts, target asset facts,
  canonical bindings, revision metadata, and bounded metadata-only neighbors.
- Added deterministic prompt sections and safe Observatory context metadata;
  no provider secrets, raw payloads, URIs, image bytes, or hidden reasoning are
  surfaced.
- Added authority, minimization, immutability, revision, provider-neutrality,
  prompt, ID-truth, world-isolation, and security regression coverage.
- Architecture version: v1.146 → v1.147.
- Code Complete: YES.
- Product Verified: YES — local Studio browser session created `world-1` with three cows, evolved all cows to Sheep, inspected Generation Trace context (`Sheep`, `cow-1..3`, revisions `1/1/1`), followed up with Merchant at `2/2/2`, created `world-2`, and confirmed current-world isolation with no browser warnings/errors. The existing deterministic fallback handled an invalid local structured candidate during creation.

## Deferred by design

- Gameplay mechanics generation and `GameplaySpecification`.
- Conversation memory/history, RAG, vector retrieval, and global context
  stores.
- Reference-image transport and similarity search; current references are
  metadata-only bounded hints.
- Context caching, durable generated-asset persistence, and reload recovery.
- Provider-specific prompt contracts and capability-specific orchestration.

## Next work order boundary

### S15-001 — Gameplay Mechanics Foundation

Define the smallest gameplay contract only after the current playable pipeline
and generated-world verification identify the actual mechanics bottleneck.
