# Sprint 14 Backlog — World Evolution

Sprint 14 moves Genesis Studio from world creation toward natural-language
world evolution while keeping the current semantic world authoritative.

## Architectural Principle

`Natural Language → WorldEvolutionRequest → WorldEvolutionIntent →
WorldSemanticDelta → semantic application → updated semantic authority → Observatory`

Semantic application is separate from Runtime execution. S14-002 mutates only
the current semantic authority; it must not mutate Runtime, AssetManifest,
Renderer, or generated assets.

## Completed

### WO-S14-001 — World Evolution Intent, Semantic Delta & Operation History Foundation

- Added shared request, intent, delta, operation, stage, and event contracts.
- Added provider-neutral AI planning with semantic-only prompts and the existing
  API/Codex structured-generation boundary.
- Added deterministic current-world target resolution, explicit group-language
  handling, semantic replacement validation, and safe failure states.
- Added production Observatory producers for History, Diff, Timeline, Trace,
  and Event Stream with operation/world correlation.
- Added current-world reset and stale-operation isolation.
- Added ADR-0256 and updated the project state/truth audit.
- Architecture version: v1.141 → v1.142.
- Code Complete: YES.
- Product Verified: YES.

### WO-S14-002 — Semantic World Delta Application Foundation

- Added the provider-independent, immutable, atomic semantic delta applier.
- Replaced the current semantic snapshot only after successful validation and
  application; entity replacement preserves IDs and additions use deterministic
  collision-free IDs.
- Added semantic revision/world-session stale protection and explicit
  `applying_semantic`, `semantic_applied`, and
  `semantic_application_failed` lifecycle facts.
- Connected applied semantic facts to History, Diff, Timeline, Trace, and Event
  Stream. Runtime and World Graph remain unchanged Runtime projections;
  synchronization is pending.
- Architecture version: v1.142 → v1.143.
- Code Complete: YES.
- Product Verified: YES — live browser matrix passed for Farm, RPG, Add, Remove,
  Theme, follow-up evolution against updated semantics, Runtime non-mutation,
  and Observatory truth.

## Next Work Order Boundary

Define and implement a separate Runtime application contract for the already
applied semantic `WorldSemanticDelta` operations:

1. identity preservation for semantic replacement;
2. deterministic ID allocation for additions;
3. RuntimeWorldStore mutation and renderer synchronization;
4. AssetManifest invalidation/rebinding;
5. applied vs planned Observatory status and post-apply World Graph truth.

Until that work is accepted, “semantic applied; Runtime synchronization
pending” is the required product behavior.
