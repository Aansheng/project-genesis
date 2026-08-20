# ADR-0258 — World Evolution Targeted Runtime Synchronization

- Status: Accepted
- Date: 2026-08-20
- Work Order: WO-S14-003
- Architecture: v1.143 → v1.144

## Context

WO-S14-002 made the semantic world authoritative and applied validated
`WorldSemanticDelta` operations atomically, but deliberately left the live
Runtime world unchanged. That temporary divergence prevented Runtime, World
Graph, and the existing visualization loop from reflecting a supported world
evolution command.

The Runtime world is a live simulation snapshot. Its player position,
velocity, controller-owned state, health, and other gameplay components must
survive semantic evolution. Re-projecting the complete semantic world would
discard those facts, reset placement, and risk recreating Runtime systems or
the camera.

## Decision

Add the provider-independent `DefaultRuntimeWorldEvolutionSynchronizer` in
`@genesis/runtime`. It consumes the immutable
`SemanticWorldMutationResult` from `@genesis/shared` and produces an immutable
`RuntimeEvolutionResult` containing the previous/updated Runtime worlds,
affected/add/remove/preserved IDs, preserved component facts, applied
operations, revision markers, and an explicit status/failure reason.

The synchronizer applies only the resolved target IDs:

- `replace-entity-semantic` preserves the Runtime entity ID, scalar position,
  Position/Velocity components, gameplay components, and all unrelated entity
  references. It updates only the Runtime `type` and existing `semantic`
  component fields that are owned by the semantic meaning.
- `add-entity` creates the same semantic + position Runtime shape used by the
  existing projection path. It uses a deterministic, collision-free local
  safe-placement policy and does not regenerate existing layout positions.
- `remove-entity` removes exactly the resolved Runtime IDs. Removing a player
  is rejected as an unsupported unsafe operation.
- `update-world-property` is a truthful `no_runtime_impact` result because the
  current Runtime model has no theme/time-of-day field. `movementSpeed` stays
  unsupported at semantic application.

The web store passes the live `RuntimeWorldStore` snapshot to the synchronizer,
builds the candidate world off to the side, and commits a successful changed
world with one `RuntimeWorldStore.setWorld` call. It keeps a per-world Runtime
semantic revision marker and last applied operation ID. World/session mismatch,
stale revision, missing target, duplicate ID, semantic mismatch, and player
removal failures return the original Runtime snapshot and do not partially
commit. Repeating an operation with the same revision/operation marker returns
`already_applied` without duplicate additions or removals.

## Lifecycle and product truth

The operation lifecycle extends semantic application with
`RUNTIME_SYNC_STARTED` and `RUNTIME_SYNC_COMPLETED`/`RUNTIME_SYNC_FAILED`, plus
correlated Runtime synchronization domain events. Observatory History and Diff
explicitly report semantic application, Runtime synchronization or no Runtime
impact, and visual synchronization pending. Runtime and World Graph are
reloaded from the authoritative Runtime store after a successful commit.

The existing Runtime execution loop, system registry, player controller,
camera, Pixi renderer, AssetManifest, AssetStore, image-generation scheduler,
and generated visual resources are not recreated or mutated by this work.
New entities use the existing renderer's primitive fallback, and existing
visual asset entries may remain after semantic replacement/removal.

## Consequences

- Semantic revision and Runtime revision stay correlated without introducing
  event sourcing, persistence, undo/redo, or a generic transaction framework.
- Runtime state continuity is preserved across targeted evolution.
- Renderer updates naturally on the next existing visualization-loop tick;
  no camera reset or bootstrap path is needed.
- Visual archetype regeneration and AssetManifest rebinding remain a separate
  future work order.
