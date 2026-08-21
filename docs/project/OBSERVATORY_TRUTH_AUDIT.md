# Observatory Truth Audit — WO-OBS-001 / WO-S15-002 / WO-S15-003

Architecture is v1.150. This audit records production behavior; test fixtures are excluded.
The final S14-006 browser session passed on 2026-08-21: one continuous `world-1`
recorded Cow→Sheep, explicit single removal, Merchant add, and Night with canonical
generation counts 1/0/1/1, revision progression 1→4, continued gameplay, four truthful
operation projections, real ready artifacts, and no browser console errors. Superseded
create-world visual operations now terminate as cancelled rather than remaining stale.

| Surface | Component | Store / view model | Classification | Current producer | Session correlation | Current-world truth | Misleading risk / treatment |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Overview | `ObservatoryOverview` | `observatoryData` + `gameStore` | REAL / PARTIAL | Runtime binding, latest `GameGenerationTrace`, GameplaySpecification, world-bound GameplayRuleSet, visual operations, AssetManifest | Current SPA stores + worldId/revision binding | Yes; unavailable fields are omitted or labelled; rules say Planning only | Legacy v1.29 mock retired; rule plans are not presented as execution |
| Trace | `ObservatoryTraceViewer` | `ObservatoryViewModel.traceView` | REAL / SEMANTIC + RUNTIME + VISUAL EXECUTION | `recordWorldEvolution` projects planning, semantic, Runtime sync, asset, manifest, renderer, and failure stages with safe metadata, including bounded generation-context summaries | `operationId + worldId + semanticRevision + runtimeSemanticRevision + visualRevision + manifestRevision + contextScope` | Yes for current operation; stale results remain failed facts and never rebind | No hidden reasoning or synthetic Runtime ticks |
| Timeline | `ObservatoryTimelineViewer` | `ObservatoryViewModel.timelineView` | REAL / SEMANTIC + RUNTIME + VISUAL EXECUTION | `WorldEvolutionOperation.stages` with planning, semantic, Runtime synchronization, generation, manifest, resolution, renderer, and sync timestamps | `operationId + worldId` | Yes for current operation | Only emitted stages; no synthetic Runtime ticks |
| History | `ObservatoryHistoryViewer` | `ObservatoryViewModel.historyView` | REAL / SEMANTIC + RUNTIME + VISUAL EXECUTION | `WorldEvolutionOperation` instruction, status, revisions, asset counts, manifest revision, and renderer counts | `operationId + worldId + visualRevision + manifestRevision` | Reports asset execution completed/failed, visual synchronized, or previous visual retained | Never claims success before the renderer callback |
| Diff | `ObservatoryDiffViewer` | `ObservatoryViewModel.diffView` | REAL / SEMANTIC + RUNTIME + VISUAL EXECUTION | Actual `WorldSemanticDelta`, `SemanticWorldMutationResult`, `RuntimeEvolutionResult`, `VisualEvolutionPlan`, and `VisualAssetExecutionResult` | `operationId + worldId + targetIds + visualRevision + manifestRevision` | Layered semantic, Runtime IDs, visual archetypes, targeted rebound/removed IDs, renderer counts, and fallback facts | Does not claim unrelated assets changed |
| Event Stream | `ObservatoryEventStream` | `ObservatoryViewModel.eventStreamView` | REAL / GAMEPLAY + DOMAIN + ASSET EVENTS | Runtime gameplay facts through `RuntimeGameplayEventCollector → Renderer observer → observatoryData.recordRuntimeGameplayEvents`, plus world evolution request/planning/semantic/Runtime and asset execution/generation/manifest/renderer/sync events | `eventId` for gameplay facts; `operationId + worldId` for evolution facts | Yes for the current Runtime world/session; raw provider payloads excluded | Gameplay facts are bounded to the latest 100 UI entries; rule plans, provider transport duplicates, synthetic ticks, and gameplay results are excluded |
| Execution Graph | `ObservatoryTraceGraph` | None | EMPTY-BY-DESIGN | No live graph producer | None | N/A | Old hardcoded CreateWorld/CreateFarm topology removed |
| World Graph | `ObservatoryWorldGraph` | Runtime view projection | REAL / PARTIAL | `RuntimeWorldStore → ObservatoryRuntimeBinding` | Current SPA Runtime store | Yes; current entities/types only | Old Farm/Barn/HarvestQuest fixture removed |
| Runtime | `ObservatoryRuntimeViewer` | `ObservatoryViewModel.runtimeView` | REAL | `RuntimeWorldStore → ObservatoryRuntimeBinding` | Current SPA Runtime store | Yes | Uninstrumented system/event/FPS values display unavailable |
| Generation Trace | `ObservatoryGeneration` | `observatoryData.generationTrace` + `gameStore.visualGenerationOperations` | REAL | Latest generation diagnostics, GameplaySpecification/RuleSet summary, and image operations, including safe context scope/world/revision/binding/reference counts | Latest current-session generation | Yes | Safe provider/model/stages/context/rule counts only; transport secrets, raw payloads, URIs, and image bytes excluded |

## Retired mock paths

- The production store no longer contains the Sprint 6 farm/history/diff/event demo builder.
- `ObservatoryOverview` no longer auto-hydrates mock data in test mode.
- The legacy fixture lives only under `src/__tests__/fixtures` and is installed by Vitest setup for historical tests.
- The shell version now comes from the centralized `PROJECT_METADATA` constant and reports v1.150.

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

## Sprint 15 context producer

WO-S15-000 keeps the full generation context out of Observatory and projects
only safe summaries. Image operations expose capability scope, current world,
semantic/Runtime/visual revisions, target archetype, canonical binding count,
and bounded metadata-only reference count. World-evolution traces expose the
same scope/revision facts when available. Secrets, raw provider events,
provider payloads, hidden reasoning, resource URIs, and binary data are not
copied into the UI model.

## Sprint 15 gameplay producer

WO-S15-001 adds a real gameplay summary producer from the current
`GameplaySpecification` and generation diagnostics. Generation Trace and the
Overview/Generation cards expose only source, validation status, revision,
mechanic count, supported/deferred counts, and primary goal. Deferred mechanics
are not represented as executed systems, timeline stages, event-stream facts,
or fake Runtime state. A missing specification remains an explicit unavailable
state.

## Sprint 15 gameplay event producer

WO-S15-002 adds the first Runtime gameplay-fact producer. The execution loop
observes accepted jumps, airborne-to-ground landing transitions, explicit AABB
contact starts, and committed entity ID-set additions/removals. Events carry
deterministic `eventId`, tick, and sequence metadata and are forwarded by the
Renderer only when the production Studio observer is attached. The Observatory
projects safe type, message, source, and tick metadata into a bounded 100-entry
current-session Event Stream.

These are observations, not rules or results: no contact automatically collects,
damages, removes, rewards, completes, or fails anything. World Evolution
request/planning/synchronization events remain separate domain facts, and the
Runtime gameplay stream is ephemeral with no persistence or replay claim.

## Sprint 15 gameplay rule producer

WO-S15-003 adds a real current-session `GameplayRuleSet` beside the
`GameplaySpecification`. Overview shows rule count, supported/partial/deferred
counts, one safe rule summary, and the explicit `Planning only` state. Rule
trigger/condition/action data is not copied into Event Stream as if it happened.
Rule IDs, selectors, and support status are Genesis-normalized/derived; raw
provider rule payloads and code are excluded. The RuleSet is bound to the
current world ID and semantic/gameplay revisions; semantic evolution marks it
stale because automatic mechanics synchronization is not implemented.

`GameplaySpecification` means desired mechanics; `GameplayRuleSet` means a
validated structured plan; `GameplayEvent` means Runtime facts; Gameplay Rule
Execution is not active. The next execution chain remains
`GameplayEvent → TriggerMatcher → ConditionEvaluator → GameplayActionExecutor → Runtime mutation`.
