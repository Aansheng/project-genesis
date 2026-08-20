# ADR-0257 — World Evolution Semantic Delta Application

- Status: Accepted
- Date: 2026-08-20
- Work Order: WO-S14-002
- Architecture: v1.142 → v1.143

## Context

WO-S14-001 produced validated `WorldSemanticDelta` plans and truthful
Observatory planning records, but a validated imperative evolution command did
not yet change the current semantic world. Runtime, AssetManifest, Renderer,
and generated assets are separate execution boundaries and must remain
unchanged in this stage.

The current web session has one semantic authority: the paired
`GameWorldModel`, world properties, world/session ID, and semantic revision in
`apps/web/src/stores/gameStore.ts`. `GameDesignSpecification` and Runtime are
inputs/projections for other parts of the pipeline, not independent semantic
copies to mutate.

## Decision

Add the provider-independent `DefaultSemanticWorldDeltaApplier` in
`@genesis/shared`. It receives a current semantic world, a validated delta,
and optional world/revision/property context. It validates the execution
preconditions, calculates changes in draft collections, and returns a deeply
immutable result. The web store commits `updatedWorld`, updated properties, and
the incremented revision only after an `applied` result.

Semantic replacement preserves each target ID and updates the current semantic
name/category while retaining unrelated entity fields. Group replacement runs
the same operation independently for every resolved target. Additions allocate
IDs from a slugged semantic name using the deterministic sequence
`name-1`, `name-2`, ... while skipping IDs already present in the current
world; the provider never owns authoritative IDs. Counted additions create
independent entities. Removal records exact removed IDs. Supported world
properties are the existing `theme` and `timeOfDay` fields. `movementSpeed`
remains an explicit unsupported/deferred operation in v1.

Validated imperative commands auto-apply because the existing Studio command
flow has no separate Apply action. The operation lifecycle becomes
`applying_semantic` → `semantic_applied` or
`semantic_application_failed`. Observatory projections use the actual mutation
result and say `Semantic change applied; Runtime synchronization pending`.

## Atomicity and stale protection

No input arrays or entity objects are mutated in place. Any invalid target,
unsupported operation, property conflict, duplicate ID, wrong world/session, or
stale semantic revision returns a failed result with the original world and
revision and no partial operation. A successful mutation increments the
semantic revision by one. Revision and world/session checks happen immediately
before the store commit, so an awaited plan cannot mutate a newer world.

## Boundary consequences

This ADR deliberately does not introduce Runtime mutation, world rebuild,
camera reset, AssetManifest/AssetStore changes, renderer updates, image
generation, persistence, event sourcing, undo/redo, or generic transactions.
Runtime and World Graph remain Runtime projections until WO-S14-003. The
temporary divergence between the updated semantic world and the old Runtime is
intentional and is exposed through History, Diff, Timeline, Trace, and Event
Stream rather than hidden behind a fully-applied label.
