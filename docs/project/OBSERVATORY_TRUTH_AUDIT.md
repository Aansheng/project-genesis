# Observatory Truth Audit — WO-OBS-001 / WO-S14-002

Architecture is v1.143. This audit records production behavior; test fixtures are excluded.

| Surface | Component | Store / view model | Classification | Current producer | Session correlation | Current-world truth | Misleading risk / treatment |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Overview | `ObservatoryOverview` | `observatoryData` + `gameStore` | REAL / PARTIAL | Runtime binding, latest `GameGenerationTrace`, visual operations, AssetManifest | Current SPA stores | Yes; unavailable fields are omitted or labelled | Legacy v1.29 mock retired; real cards only |
| Trace | `ObservatoryTraceViewer` | `ObservatoryViewModel.traceView` | REAL / SEMANTIC APPLICATION | `recordWorldEvolution` projects operation stages, snapshot, and safe metadata through semantic mutation | `operationId + worldId + semanticRevision` | Yes for current semantic operation | Trace ends at semantic mutation; no Runtime stage or hidden reasoning |
| Timeline | `ObservatoryTimelineViewer` | `ObservatoryViewModel.timelineView` | REAL / SEMANTIC APPLICATION | `WorldEvolutionOperation.stages` with planning and semantic-application timestamps | `operationId + worldId` | Yes for current semantic operation | Only emitted stages; no synthetic Runtime ticks |
| History | `ObservatoryHistoryViewer` | `ObservatoryViewModel.historyView` | REAL / SEMANTIC APPLICATION | `WorldEvolutionOperation` instruction, status, revision, and delta summary | `operationId + worldId` | Yes; reports semantic applied and Runtime sync pending | Never says the whole world is fully applied |
| Diff | `ObservatoryDiffViewer` | `ObservatoryViewModel.diffView` | REAL / SEMANTIC APPLICATION | Actual `WorldSemanticDelta` plus `SemanticWorldMutationResult` | `operationId + worldId + targetIds` | Yes; marked `SEMANTIC APPLIED` and Runtime sync pending | Does not compare rendered snapshots or claim Runtime apply |
| Event Stream | `ObservatoryEventStream` | `ObservatoryViewModel.eventStreamView` | REAL / DOMAIN EVENTS | World evolution request/planned/semantic-application events | `operationId + worldId` | Yes for current semantic operation | Runtime ticks and hidden provider logs excluded |
| Execution Graph | `ObservatoryTraceGraph` | None | EMPTY-BY-DESIGN | No live graph producer | None | N/A | Old hardcoded CreateWorld/CreateFarm topology removed |
| World Graph | `ObservatoryWorldGraph` | Runtime view projection | REAL / PARTIAL | `RuntimeWorldStore → ObservatoryRuntimeBinding` | Current SPA Runtime store | Yes; current entities/types only | Old Farm/Barn/HarvestQuest fixture removed |
| Runtime | `ObservatoryRuntimeViewer` | `ObservatoryViewModel.runtimeView` | REAL | `RuntimeWorldStore → ObservatoryRuntimeBinding` | Current SPA Runtime store | Yes | Uninstrumented system/event/FPS values display unavailable |
| Generation Trace | `ObservatoryGeneration` | `observatoryData.generationTrace` + `gameStore.visualGenerationOperations` | REAL | Latest generation diagnostics and image operations | Latest current-session generation | Yes | Safe provider/model/stages only; transport secrets excluded |

## Retired mock paths

- The production store no longer contains the Sprint 6 farm/history/diff/event demo builder.
- `ObservatoryOverview` no longer auto-hydrates mock data in test mode.
- The legacy fixture lives only under `src/__tests__/fixtures` and is installed by Vitest setup for historical tests.
- The shell version now comes from the centralized `PROJECT_METADATA` constant and reports v1.143.

## Sprint 14 producers

WO-S14-001 connects validated planning operations to Observatory. WO-S14-002 adds
the real semantic application lifecycle: `SEMANTIC_APPLICATION_STARTED` and
`SEMANTIC_APPLICATION_COMPLETED`/`FAILED`, semantic revision, applied Diff facts,
and `world.evolution.semantic_application_started` /
`semantic_applied` / `semantic_application_failed` domain events.

The semantic world is now updated while Runtime and World Graph intentionally
remain Runtime projections. This temporary divergence is explicit: History and
Diff say `Semantic change applied; Runtime synchronization pending`, and the
Runtime/World Graph surfaces continue to show the pre-synchronization Runtime
state. Live Farm/RPG/Add/Remove/Theme browser verification confirmed this
behavior. New worlds reset evolution projections and stale operations cannot
cross world/session or semantic-revision boundaries.

Runtime application, AssetManifest replacement, visual regeneration, and
post-apply World Graph updates remain out of scope and require WO-S14-003.
