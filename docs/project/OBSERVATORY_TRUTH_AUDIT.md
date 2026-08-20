# Observatory Truth Audit — WO-OBS-001 / WO-S14-004

Architecture is v1.145. This audit records production behavior; test fixtures are excluded.
The live browser verification matrix passed on 2026-08-20.

| Surface | Component | Store / view model | Classification | Current producer | Session correlation | Current-world truth | Misleading risk / treatment |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Overview | `ObservatoryOverview` | `observatoryData` + `gameStore` | REAL / PARTIAL | Runtime binding, latest `GameGenerationTrace`, visual operations, AssetManifest | Current SPA stores | Yes; unavailable fields are omitted or labelled | Legacy v1.29 mock retired; real cards only |
| Trace | `ObservatoryTraceViewer` | `ObservatoryViewModel.traceView` | REAL / SEMANTIC + RUNTIME + VISUAL PLANNING | `recordWorldEvolution` projects planning, semantic, Runtime sync, and visual planning stages, snapshot, and safe metadata | `operationId + worldId + semanticRevision + runtimeSemanticRevision + visualRevision` | Yes for current planned operation | No hidden reasoning or synthetic Runtime ticks |
| Timeline | `ObservatoryTimelineViewer` | `ObservatoryViewModel.timelineView` | REAL / SEMANTIC + RUNTIME + VISUAL PLANNING | `WorldEvolutionOperation.stages` with planning, semantic, Runtime synchronization, and visual delta timestamps | `operationId + worldId` | Yes for current planned operation | Only emitted stages; no synthetic Runtime ticks |
| History | `ObservatoryHistoryViewer` | `ObservatoryViewModel.historyView` | REAL / SEMANTIC + RUNTIME + VISUAL PLANNING | `WorldEvolutionOperation` instruction, status, revisions, delta summary, and generation count | `operationId + worldId + visualRevision` | Reports semantic applied, Runtime synchronized/no-impact, visual delta planned/failed, and asset execution pending/no-generation | Never claims visual assets were regenerated |
| Diff | `ObservatoryDiffViewer` | `ObservatoryViewModel.diffView` | REAL / SEMANTIC + RUNTIME + VISUAL PLANNING | Actual `WorldSemanticDelta`, `SemanticWorldMutationResult`, `RuntimeEvolutionResult`, and `VisualEvolutionPlan` | `operationId + worldId + targetIds + visualRevision` | Layered semantic, Runtime, visual-archetype, binding, orphan, and pending execution facts | Does not claim generated visuals changed |
| Event Stream | `ObservatoryEventStream` | `ObservatoryViewModel.eventStreamView` | REAL / DOMAIN EVENTS | World evolution request/planned/semantic-application/Runtime-sync/visual-planning events | `operationId + worldId` | Yes for current semantic, Runtime, and visual planning operation | Image-generation events, Runtime ticks, and hidden provider logs excluded |
| Execution Graph | `ObservatoryTraceGraph` | None | EMPTY-BY-DESIGN | No live graph producer | None | N/A | Old hardcoded CreateWorld/CreateFarm topology removed |
| World Graph | `ObservatoryWorldGraph` | Runtime view projection | REAL / PARTIAL | `RuntimeWorldStore → ObservatoryRuntimeBinding` | Current SPA Runtime store | Yes; current entities/types only | Old Farm/Barn/HarvestQuest fixture removed |
| Runtime | `ObservatoryRuntimeViewer` | `ObservatoryViewModel.runtimeView` | REAL | `RuntimeWorldStore → ObservatoryRuntimeBinding` | Current SPA Runtime store | Yes | Uninstrumented system/event/FPS values display unavailable |
| Generation Trace | `ObservatoryGeneration` | `observatoryData.generationTrace` + `gameStore.visualGenerationOperations` | REAL | Latest generation diagnostics and image operations | Latest current-session generation | Yes | Safe provider/model/stages only; transport secrets excluded |

## Retired mock paths

- The production store no longer contains the Sprint 6 farm/history/diff/event demo builder.
- `ObservatoryOverview` no longer auto-hydrates mock data in test mode.
- The legacy fixture lives only under `src/__tests__/fixtures` and is installed by Vitest setup for historical tests.
- The shell version now comes from the centralized `PROJECT_METADATA` constant and reports v1.145.

## Sprint 14 producers

WO-S14-001 connects validated planning operations to Observatory. WO-S14-002
adds the semantic application lifecycle. WO-S14-003 adds the real Runtime
sync lifecycle: `RUNTIME_SYNC_STARTED` and
`RUNTIME_SYNC_COMPLETED`/`FAILED`, Runtime semantic revision, exact Runtime
Diff facts, and `world.evolution.runtime_sync_started` /
`runtime_synced` / `runtime_sync_failed` domain events. WO-S14-004 adds
`VISUAL_IMPACT_STARTED` and `VISUAL_DELTA_PLANNED`/`FAILED`, visual revision and
planning state, layered visual Diff facts, and
`world.evolution.visual_impact_started` /
`visual_delta_planned` / `visual_delta_failed` domain events. These are planning
facts only: no image event, AssetManifest mutation, AssetStore invalidation, or
Pixi texture replacement is emitted.

The semantic world and targeted Runtime world now converge in the same session,
then receive a deterministic visual delta plan. Runtime and World Graph are
refreshed from `RuntimeWorldStore`; History and Diff explicitly distinguish
visual archetype planning from pending asset execution. New worlds reset
evolution, Runtime, and visual revision markers, and stale operations cannot
cross world/session, semantic-revision, Runtime-revision, or visual-plan
boundaries.
