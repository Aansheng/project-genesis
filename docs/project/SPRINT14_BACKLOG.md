# Sprint 14 Backlog — World Evolution

Sprint 14 moves Genesis Studio from world creation toward natural-language
world evolution while keeping the current semantic world authoritative.

## Architectural Principle

`Natural Language → WorldEvolutionRequest → WorldEvolutionIntent →
WorldSemanticDelta → validated Operation History → Observatory`

Planning is separate from execution. A planning operation must not mutate
Runtime, AssetManifest, Renderer, or the current semantic snapshot.

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

## Next Work Order Boundary

Define and implement a separate Runtime application contract for validated
`WorldSemanticDelta` operations:

1. identity preservation for semantic replacement;
2. deterministic ID allocation for additions;
3. RuntimeWorldStore mutation and renderer synchronization;
4. AssetManifest invalidation/rebinding;
5. applied vs planned Observatory status and post-apply World Graph truth.

Until that work is accepted, “Runtime unchanged” is the required product
behavior.
