# Observatory Truth Audit — WO-OBS-001 / WO-S14-001

Architecture is v1.142. This audit records production behavior; test fixtures are excluded.

| Surface | Component | Store / view model | Classification | Current producer | Session correlation | Current-world truth | Misleading risk / treatment |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Overview | `ObservatoryOverview` | `observatoryData` + `gameStore` | REAL / PARTIAL | Runtime binding, latest `GameGenerationTrace`, visual operations, AssetManifest | Current SPA stores | Yes; unavailable fields are omitted or labelled | Legacy v1.29 mock retired; real cards only |
| Trace | `ObservatoryTraceViewer` | `ObservatoryViewModel.traceView` | REAL / PLANNING | `recordWorldEvolution` projects operation stages, snapshot, and safe metadata | `operationId + worldId` | Yes for current planned operation | No hidden reasoning; provider/source metadata is explicit |
| Timeline | `ObservatoryTimelineViewer` | `ObservatoryViewModel.timelineView` | REAL / PLANNING | `WorldEvolutionOperation.stages` with timestamps | `operationId + worldId` | Yes for current planned operation | Only emitted planning stages; no synthetic Runtime ticks |
| History | `ObservatoryHistoryViewer` | `ObservatoryViewModel.historyView` | REAL / PLANNING | `WorldEvolutionOperation` instruction, status, and delta summary | `operationId + worldId` | Yes; new world resets projection | History is operation history, not raw provider logs |
| Diff | `ObservatoryDiffViewer` | `ObservatoryViewModel.diffView` | REAL / PLANNING | `WorldSemanticDelta` projection | `operationId + worldId` | Yes; marked `PLANNED` and Runtime unchanged | No applied diff is claimed |
| Event Stream | `ObservatoryEventStream` | `ObservatoryViewModel.eventStreamView` | REAL / DOMAIN EVENTS | World evolution request/planned/validation events | `operationId + worldId` | Yes for current planned operation | Runtime ticks and hidden provider logs excluded |
| Execution Graph | `ObservatoryTraceGraph` | None | EMPTY-BY-DESIGN | No live graph producer | None | N/A | Old hardcoded CreateWorld/CreateFarm topology removed |
| World Graph | `ObservatoryWorldGraph` | Runtime view projection | REAL / PARTIAL | `RuntimeWorldStore → ObservatoryRuntimeBinding` | Current SPA Runtime store | Yes; current entities/types only | Old Farm/Barn/HarvestQuest fixture removed |
| Runtime | `ObservatoryRuntimeViewer` | `ObservatoryViewModel.runtimeView` | REAL | `RuntimeWorldStore → ObservatoryRuntimeBinding` | Current SPA Runtime store | Yes | Uninstrumented system/event/FPS values display unavailable |
| Generation Trace | `ObservatoryGeneration` | `observatoryData.generationTrace` + `gameStore.visualGenerationOperations` | REAL | Latest generation diagnostics and image operations | Latest current-session generation | Yes | Safe provider/model/stages only; transport secrets excluded |

## Retired mock paths

- The production store no longer contains the Sprint 6 farm/history/diff/event demo builder.
- `ObservatoryOverview` no longer auto-hydrates mock data in test mode.
- The legacy fixture lives only under `src/__tests__/fixtures` and is installed by Vitest setup for historical tests.
- The shell version now comes from the centralized `PROJECT_METADATA` constant and reports v1.142.

## Sprint 14 producers

WO-S14-001 connects validated planning operations to History, `WorldSemanticDelta` to Diff,
planning stages to Timeline, correlated operation metadata to Trace, and meaningful
evolution domain events to Event Stream. These projections are current-world/session
scoped and explicitly report `PLANNED` / Runtime unchanged.

Runtime application, AssetManifest replacement, and post-apply World Graph updates
remain out of scope for this foundation and require a separate execution contract.
