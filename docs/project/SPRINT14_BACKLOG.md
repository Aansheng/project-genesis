# Sprint 14 Backlog — World Evolution

Sprint 14 moves Genesis Studio from world creation toward natural-language
world evolution while keeping the current semantic world authoritative.

## Architectural Principle

`Natural Language → WorldEvolutionRequest → WorldEvolutionIntent →
WorldSemanticDelta → semantic application → targeted Runtime synchronization →
visual impact analysis → targeted asset impact plan → canonical asset execution →
manifest/store rebinding → incremental Renderer synchronization → Observatory`

Semantic application, Runtime synchronization, visual planning, and visual
execution are separate commits. S14-003 applies only the targeted Runtime
delta after semantic commit. S14-004 plans immutable visual/specification
deltas. S14-005 executes only the planner-owned canonical set and mutates only
affected manifest/store/renderer bindings.

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

### WO-S14-003 — Targeted Runtime Mutation & Semantic Synchronization

- Added the provider-independent Runtime synchronization contract and
  deterministic targeted synchronizer.
- Preserved replacement identity, Runtime state/components, exact removal,
  deterministic safe add placement, and player-removal safety.
- Connected one-shot `RuntimeWorldStore.setWorld` commits and revision-based
  idempotency to the existing renderer loop without rebuilding the world.
- Connected Runtime synchronization lifecycle facts to Observatory and handed
  visual execution off with unchanged AssetManifest/image counts.
- Architecture version: v1.143 → v1.144.
- Code Complete: YES.
- Product Verified: YES — live Farm/RPG replace-add-remove, movement continuity,
  world-property no-impact, Observatory lifecycle, unchanged asset counts, and
  empty browser error/warning logs were verified.

### WO-S14-004 — Visual Delta Planning & Targeted Asset Impact Analysis

- Added the provider-independent deterministic visual evolution planner and
  immutable visual/asset impact plan contracts.
- Reused the existing visual generation identity and grouping policy to plan
  canonical generation requirements, binding-only changes, orphaned assets,
  replacements, additions, removals, and unaffected asset/archetype facts.
- Stored current VisualDesignSpecification and AssetSpecification state with a
  per-world visual revision. Theme/palette changes are broad eligible impact;
  `timeOfDay` is background-only in the current visual model.
- Connected visual lifecycle facts to History, Diff, Timeline, Trace, and Event
  Stream. No image generation, scheduler enqueue, AssetManifest/AssetStore
  mutation, texture replacement, or visual-world rebuild occurs.
- Architecture version: v1.144 → v1.145.
- Code Complete: YES.
- Product Verified: YES — live browser matrix verified Farm/RPG replace-add-remove,
  background-only night planning, Runtime/entity continuity, Observatory lifecycle,
  zero console errors, and unchanged image count through no-generation changes.

### WO-S14-005 — Targeted Asset Execution, Manifest Rebinding & Incremental Visual Synchronization

- Added `VisualAssetEvolutionExecutor` at the existing web asset-policy seam.
  It consumes only S14-004 `generationRequired` canonical requirements and
  reuses the existing image client, FIFO scheduler, AssetStore, and Pixi
  manifest application path.
- Cow ×3 → Sheep issues exactly one Sheep request, preserves the old visual
  while queued/generating/applying, then rebinds all three stable bindings to
  one generated resource. Add/replace/night/remove paths remain targeted;
  unrelated manifest entries preserve identity and partial shared removals do
  not retire the remaining resource.
- Added generation-safe targeted invalidation, off-to-side manifest validation,
  manifest revision facts, stale world/revision/token rejection, queued-job
  cancellation handoff, idempotent execution, and failure fallback that keeps
  semantic/Runtime state unchanged.
- Connected `ASSET_EXECUTION_STARTED` through `VISUAL_SYNC_COMPLETED`/failed
  stages and real domain events to Observatory, including generation counts,
  manifest rebinds, renderer-applied bindings, and previous-visual retention.
- Added executor, AssetStore, renderer, and web integration regression tests.
- Architecture version: v1.145 → v1.146.
- Code Complete: YES.
- Product Verified: YES — the controlled scenario and final continuous multi-turn browser
  session passed.

### WO-S14-006 — Multi-Turn World Evolution E2E & Sprint Freeze

- Verified one continuous world/session through Cow→Sheep, explicit single binding remove,
  Merchant add, Night background replacement, and final gameplay.
- Recorded canonical generation accounting 1/0/1/1, revision progression 1→4, unaffected
  asset preservation, renderer application, and full multi-operation Observatory truth.
- Fixed superseded create-world visual Activity so nonterminal jobs converge to cancelled;
  added one focused regression without changing architecture contracts.
- Added the Sprint 14 review and freeze decision.
- Architecture version: v1.146 → v1.146.
- Code Complete: YES.
- Product Verified: YES.
- FROZEN: YES.

## Next Work Order Boundary

### Sprint 15 — Capability-Specific Generation Context Foundation

WO-S15-001 now provides the gameplay intent/specification boundary while keeping
the Sprint 14 semantic/Runtime/visual pipeline authoritative. See
`SPRINT15_BACKLOG.md`. Measured Runtime gameplay execution is the next boundary;
durable generated-asset lifecycle, gameplay persistence, and richer
reference-guided generation stay deferred.
