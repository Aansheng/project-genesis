# Observatory Truth Audit — WO-OBS-001

Architecture remains v1.141. This audit records production behavior; test fixtures are excluded.

| Surface | Component | Store / view model | Classification | Current producer | Session correlation | Current-world truth | Misleading risk / treatment |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Overview | `ObservatoryOverview` | `observatoryData` + `gameStore` | REAL / PARTIAL | Runtime binding, latest `GameGenerationTrace`, visual operations, AssetManifest | Current SPA stores | Yes; unavailable fields are omitted or labelled | Legacy v1.29 mock retired; real cards only |
| Trace | `ObservatoryTraceViewer` | `ObservatoryViewModel.traceView` | EMPTY-BY-DESIGN | No current production producer | None | N/A | Explicit current-session empty state |
| Timeline | `ObservatoryTimelineViewer` | `ObservatoryViewModel.timelineView` | EMPTY-BY-DESIGN | No meaningful timestamped operation producer | None | N/A | Explicit session empty state |
| History | `ObservatoryHistoryViewer` | `ObservatoryViewModel.historyView` | EMPTY-BY-DESIGN | No user-operation history producer | None | N/A | Explicit session empty state |
| Diff | `ObservatoryDiffViewer` | `ObservatoryViewModel.diffView` | EMPTY-BY-DESIGN | No semantic delta producer | None | N/A | Explicit semantic-delta empty state |
| Event Stream | `ObservatoryEventStream` | `ObservatoryViewModel.eventStreamView` | EMPTY-BY-DESIGN | No meaningful domain-event producer | None | N/A | Explicit domain-event empty state; Runtime ticks excluded |
| Execution Graph | `ObservatoryTraceGraph` | None | EMPTY-BY-DESIGN | No live graph producer | None | N/A | Old hardcoded CreateWorld/CreateFarm topology removed |
| World Graph | `ObservatoryWorldGraph` | Runtime view projection | REAL / PARTIAL | `RuntimeWorldStore → ObservatoryRuntimeBinding` | Current SPA Runtime store | Yes; current entities/types only | Old Farm/Barn/HarvestQuest fixture removed |
| Runtime | `ObservatoryRuntimeViewer` | `ObservatoryViewModel.runtimeView` | REAL | `RuntimeWorldStore → ObservatoryRuntimeBinding` | Current SPA Runtime store | Yes | Uninstrumented system/event/FPS values display unavailable |
| Generation Trace | `ObservatoryGeneration` | `observatoryData.generationTrace` + `gameStore.visualGenerationOperations` | REAL | Latest generation diagnostics and image operations | Latest current-session generation | Yes | Safe provider/model/stages only; transport secrets excluded |

## Retired mock paths

- The production store no longer contains the Sprint 6 farm/history/diff/event demo builder.
- `ObservatoryOverview` no longer auto-hydrates mock data in test mode.
- The legacy fixture lives only under `src/__tests__/fixtures` and is installed by Vitest setup for historical tests.
- The shell version now comes from the centralized `PROJECT_METADATA` constant and reports v1.141.

## Sprint 14 producers

Sprint 14 may connect: evolution operations to History; `WorldSemanticDelta` to Diff; planning/application lifecycle to Timeline; an evolution correlation chain to Trace; meaningful evolution domain events to Event Stream; and the post-delta Runtime world to World Graph. This audit adds none of those systems.

