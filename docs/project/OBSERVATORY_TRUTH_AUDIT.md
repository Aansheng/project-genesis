# Observatory Truth Audit — WO-OBS-001 / WO-S14-003

Architecture is v1.144. This audit records production behavior; test fixtures are excluded.

| Surface | Component | Store / view model | Classification | Current producer | Session correlation | Current-world truth | Misleading risk / treatment |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Overview | `ObservatoryOverview` | `observatoryData` + `gameStore` | REAL / PARTIAL | Runtime binding, latest `GameGenerationTrace`, visual operations, AssetManifest | Current SPA stores | Yes; unavailable fields are omitted or labelled | Legacy v1.29 mock retired; real cards only |
| Trace | `ObservatoryTraceViewer` | `ObservatoryViewModel.traceView` | REAL / SEMANTIC + RUNTIME APPLICATION | `recordWorldEvolution` projects planning, semantic, and Runtime sync stages, snapshot, and safe metadata | `operationId + worldId + semanticRevision + runtimeSemanticRevision` | Yes for current synchronized operation | No hidden reasoning or synthetic Runtime ticks |
| Timeline | `ObservatoryTimelineViewer` | `ObservatoryViewModel.timelineView` | REAL / SEMANTIC + RUNTIME APPLICATION | `WorldEvolutionOperation.stages` with planning, semantic, and Runtime synchronization timestamps | `operationId + worldId` | Yes for current synchronized operation | Only emitted stages; no synthetic Runtime ticks |
| History | `ObservatoryHistoryViewer` | `ObservatoryViewModel.historyView` | REAL / SEMANTIC + RUNTIME APPLICATION | `WorldEvolutionOperation` instruction, status, revisions, and delta summary | `operationId + worldId` | Reports semantic applied plus Runtime synchronized/no-impact/failed and visual pending | Never claims visual assets were regenerated |
| Diff | `ObservatoryDiffViewer` | `ObservatoryViewModel.diffView` | REAL / SEMANTIC + RUNTIME APPLICATION | Actual `WorldSemanticDelta`, `SemanticWorldMutationResult`, and `RuntimeEvolutionResult` | `operationId + worldId + targetIds` | Marked semantic applied plus Runtime synchronized/no-impact/failed | Does not claim generated visuals changed |
| Event Stream | `ObservatoryEventStream` | `ObservatoryViewModel.eventStreamView` | REAL / DOMAIN EVENTS | World evolution request/planned/semantic-application/Runtime-sync events | `operationId + worldId` | Yes for current semantic and Runtime operation | Runtime ticks and hidden provider logs excluded |
| Execution Graph | `ObservatoryTraceGraph` | None | EMPTY-BY-DESIGN | No live graph producer | None | N/A | Old hardcoded CreateWorld/CreateFarm topology removed |
| World Graph | `ObservatoryWorldGraph` | Runtime view projection | REAL / PARTIAL | `RuntimeWorldStore → ObservatoryRuntimeBinding` | Current SPA Runtime store | Yes; current entities/types only | Old Farm/Barn/HarvestQuest fixture removed |
| Runtime | `ObservatoryRuntimeViewer` | `ObservatoryViewModel.runtimeView` | REAL | `RuntimeWorldStore → ObservatoryRuntimeBinding` | Current SPA Runtime store | Yes | Uninstrumented system/event/FPS values display unavailable |
| Generation Trace | `ObservatoryGeneration` | `observatoryData.generationTrace` + `gameStore.visualGenerationOperations` | REAL | Latest generation diagnostics and image operations | Latest current-session generation | Yes | Safe provider/model/stages only; transport secrets excluded |

## Retired mock paths

- The production store no longer contains the Sprint 6 farm/history/diff/event demo builder.
- `ObservatoryOverview` no longer auto-hydrates mock data in test mode.
- The legacy fixture lives only under `src/__tests__/fixtures` and is installed by Vitest setup for historical tests.
- The shell version now comes from the centralized `PROJECT_METADATA` constant and reports v1.144.

## Sprint 14 producers

WO-S14-001 connects validated planning operations to Observatory. WO-S14-002
adds the semantic application lifecycle. WO-S14-003 adds the real Runtime
sync lifecycle: `RUNTIME_SYNC_STARTED` and
`RUNTIME_SYNC_COMPLETED`/`FAILED`, Runtime semantic revision, exact Runtime
Diff facts, and `world.evolution.runtime_sync_started` /
`runtime_synced` / `runtime_sync_failed` domain events.

The semantic world and targeted Runtime world now converge in the same session.
Runtime and World Graph are refreshed from `RuntimeWorldStore`; History and
Diff still explicitly label visual synchronization pending because no
AssetManifest or generated visual mutation occurs. New worlds reset evolution
and Runtime revision markers, and stale operations cannot cross world/session
or semantic-revision boundaries.
