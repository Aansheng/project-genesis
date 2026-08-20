# Observatory Truth Audit — WO-OBS-001 / WO-S14-005

Architecture is v1.146. This audit records production behavior; test fixtures are excluded.
The S14-004 planning browser matrix passed on 2026-08-20. The controlled
S14-005 Cow ×3 → Sheep execution scenario also passed: one Sheep request,
retained interim visuals, targeted rebinding, complete Observatory lifecycle,
and no console errors. The remaining multi-scenario matrix and direct movement
input subcheck are still pending.

| Surface | Component | Store / view model | Classification | Current producer | Session correlation | Current-world truth | Misleading risk / treatment |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Overview | `ObservatoryOverview` | `observatoryData` + `gameStore` | REAL / PARTIAL | Runtime binding, latest `GameGenerationTrace`, visual operations, AssetManifest | Current SPA stores | Yes; unavailable fields are omitted or labelled | Legacy v1.29 mock retired; real cards only |
| Trace | `ObservatoryTraceViewer` | `ObservatoryViewModel.traceView` | REAL / SEMANTIC + RUNTIME + VISUAL EXECUTION | `recordWorldEvolution` projects planning, semantic, Runtime sync, asset, manifest, renderer, and failure stages with safe metadata | `operationId + worldId + semanticRevision + runtimeSemanticRevision + visualRevision + manifestRevision` | Yes for current operation; stale results remain failed facts and never rebind | No hidden reasoning or synthetic Runtime ticks |
| Timeline | `ObservatoryTimelineViewer` | `ObservatoryViewModel.timelineView` | REAL / SEMANTIC + RUNTIME + VISUAL EXECUTION | `WorldEvolutionOperation.stages` with planning, semantic, Runtime synchronization, generation, manifest, resolution, renderer, and sync timestamps | `operationId + worldId` | Yes for current operation | Only emitted stages; no synthetic Runtime ticks |
| History | `ObservatoryHistoryViewer` | `ObservatoryViewModel.historyView` | REAL / SEMANTIC + RUNTIME + VISUAL EXECUTION | `WorldEvolutionOperation` instruction, status, revisions, asset counts, manifest revision, and renderer counts | `operationId + worldId + visualRevision + manifestRevision` | Reports asset execution completed/failed, visual synchronized, or previous visual retained | Never claims success before the renderer callback |
| Diff | `ObservatoryDiffViewer` | `ObservatoryViewModel.diffView` | REAL / SEMANTIC + RUNTIME + VISUAL EXECUTION | Actual `WorldSemanticDelta`, `SemanticWorldMutationResult`, `RuntimeEvolutionResult`, `VisualEvolutionPlan`, and `VisualAssetExecutionResult` | `operationId + worldId + targetIds + visualRevision + manifestRevision` | Layered semantic, Runtime IDs, visual archetypes, targeted rebound/removed IDs, renderer counts, and fallback facts | Does not claim unrelated assets changed |
| Event Stream | `ObservatoryEventStream` | `ObservatoryViewModel.eventStreamView` | REAL / DOMAIN + ASSET EVENTS | World evolution request/planning/semantic/Runtime plus asset execution/generation/manifest/renderer/sync events | `operationId + worldId` | Yes for current operation; raw provider payloads excluded | Provider transport duplicates and Runtime ticks excluded |
| Execution Graph | `ObservatoryTraceGraph` | None | EMPTY-BY-DESIGN | No live graph producer | None | N/A | Old hardcoded CreateWorld/CreateFarm topology removed |
| World Graph | `ObservatoryWorldGraph` | Runtime view projection | REAL / PARTIAL | `RuntimeWorldStore → ObservatoryRuntimeBinding` | Current SPA Runtime store | Yes; current entities/types only | Old Farm/Barn/HarvestQuest fixture removed |
| Runtime | `ObservatoryRuntimeViewer` | `ObservatoryViewModel.runtimeView` | REAL | `RuntimeWorldStore → ObservatoryRuntimeBinding` | Current SPA Runtime store | Yes | Uninstrumented system/event/FPS values display unavailable |
| Generation Trace | `ObservatoryGeneration` | `observatoryData.generationTrace` + `gameStore.visualGenerationOperations` | REAL | Latest generation diagnostics and image operations | Latest current-session generation | Yes | Safe provider/model/stages only; transport secrets excluded |

## Retired mock paths

- The production store no longer contains the Sprint 6 farm/history/diff/event demo builder.
- `ObservatoryOverview` no longer auto-hydrates mock data in test mode.
- The legacy fixture lives only under `src/__tests__/fixtures` and is installed by Vitest setup for historical tests.
- The shell version now comes from the centralized `PROJECT_METADATA` constant and reports v1.146.

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
`visual_delta_planned` / `visual_delta_failed` domain events. WO-S14-005 adds
`ASSET_EXECUTION_STARTED`, `ASSET_GENERATION_STARTED`, `ASSET_GENERATED`,
`MANIFEST_REBOUND`, `ASSET_RESOLVED`, `RENDERER_APPLIED`, and
`VISUAL_SYNC_COMPLETED`/`FAILED` facts plus safe asset domain events. Only the
planner-owned canonical requests are exposed; raw provider payloads are not
copied into Observatory.

The semantic world and targeted Runtime world now converge in the same session,
then receive a deterministic visual delta plan and targeted asset execution.
Runtime and World Graph are refreshed from `RuntimeWorldStore`; History and
Diff distinguish queued generation, manifest rebinding, renderer application,
successful visual synchronization, and previous-visual fallback. New worlds
reset evolution, Runtime, visual, and manifest revision markers, and stale
operations cannot cross world/session, semantic-revision, Runtime-revision,
visual-plan, or execution-token boundaries.
