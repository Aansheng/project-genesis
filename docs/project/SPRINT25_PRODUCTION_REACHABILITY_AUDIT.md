# Sprint 25 — Production Reachability & Legacy Disposition Audit

**Date:** 2026-08-27
**Work order:** WO-S25-001
**Architecture:** v1.173 → v1.173
**Mode:** audit-only; no product architecture or runtime behavior change

## Decision summary

Sprint 24 is treated as frozen at v1.173. This work order audited whether the
capabilities described by the repository are reachable from the current Genesis
Studio product path. It did not delete, reconnect, or refactor legacy systems.

The current product path is reachable end to end for the following chains:

- Studio command input → current generation providers or deterministic fallback
  → semantic world → Game DSL → Runtime projection → Runtime gameplay loop →
  Pixi renderer.
- Active-world conversational evolution → validated semantic delta → Runtime
  synchronization → gameplay reconciliation → visual/asset evolution.
- Runtime gameplay → authoritative session/progression state → Studio lifecycle
  presentation and Observatory projection.
- Visual specification → asset manifest and resolver → browser image-generation
  gateway → published asset or intentional static/primitive fallback → Pixi.
- Generation, Runtime, gameplay, visual, and evolution facts → current
  Observatory store/adapter/view path.

The old `DefaultPromptBuilder`/`strategy/`/legacy Planner/`DefaultPipeline`
stack, old Canvas2D `renderWorld.ts`, and Mario/demo bootstrap are not on the
current Web production call chain. Most are retained as `FROZEN_LEGACY` because
they remain exported, documented, or covered by historical tests. The old
Canvas2D renderer is a `DEAD` candidate by repository call-site evidence, but
its public package export means deletion is not considered trivial during this
audit.

No current product reachability blocker was found. The next control-plane
state is `SPRINT25_FREEZE_REVIEW`; no cleanup WO is opened in the audit-only
work order.

## Disposition vocabulary

- **ACTIVE** — reachable from the current production path and contributes to
  current product behavior.
- **SUPPORTING** — reachable or required as a contract/seed/compatibility
  boundary, but not itself the primary authority or user-visible path.
- **FROZEN_LEGACY** — retained for historical compatibility, tests, exports, or
  documentation, but not reachable from the current production path.
- **DEAD** — no current repository production call site was found; removal still
  requires an explicit bounded cleanup decision when exports or external API
  compatibility are involved.

## Audit method and evidence standard

Evidence was gathered from:

1. `AGENTS.md`, `PROJECT_STATE.md`, `CHANGELOG.md`, the Engineering Control
   Plane projections, and the latest accepted lifecycle ADRs.
2. The actual Web entry path and constructor wiring in `apps/web`.
3. Static import/constructor/call-site searches excluding tests and docs, then
   a second pass including tests to distinguish production reachability from
   local contract coverage.
4. Focused source inspection of the provider, pipeline, Runtime, Renderer,
   assets, and Observatory boundaries.
5. Test inventory and representative tests, including the Sprint 19 false
   confidence heuristic.

Compilation, a package export, a unit test, or manual construction of a
downstream object is not treated as proof of Product Capability Reachability.
The decisive question is whether the current product entry point constructs and
connects the subsystem on the real execution path.

## Current production entry path

The current Web front door is:

`apps/web/src/main.ts` → Vue `App.vue` → router →
`GameWorkspacePage.vue` → `GenesisStudioShell.vue` →
`StudioCommandBar.vue` → `useGameStore().send()`.

The Studio viewport is composed by `GameViewportPanel.vue`; the full Observatory
is composed by `ObservatoryShell.vue`. The Web layer owns composition and
registration, while the Runtime and Renderer packages remain independent of Vue
and Pinia.

## Real production chains

### Chain A — initial world generation

`StudioCommandBar` sends input to `gameStore.send()`.

`gameStore.createCommandExecutor()` constructs:

`DefaultIntentRouter` → `DefaultGameIntentExtractor` →
`DefaultCreateWorldPipeline` → `DefaultRuntimeProjection` →
`DefaultCreateWorldRuntimeExecutor` → `RuntimeWorldStore`.

When the gateway is configured or the default local gateway is available, the
pipeline receives:

`BrowserStructuredGenerationClient` →
`LLMGameWorldGenerationCandidateProvider` →
`GameWorldGenerationProviderAdapter` →
`DefaultGameWorldValidator` → `FallbackGameWorldGenerationProvider`.

Gameplay uses the corresponding current provider, validator, builder, and
`FallbackGameplayGenerationProvider`. If the provider fails or produces an
invalid/incomplete candidate, the deterministic provider is intentionally used
and diagnostics record the selection outcome. This fallback is a product
recovery path, not a mock.

The current async pipeline is explicit in
`packages/ai/src/game-intent/pipeline/DefaultCreateWorldPipeline.ts`: it
extracts intent, invokes the generation provider, builds the semantic world
into Game DSL, projects the DSL into Runtime World, invokes gameplay
generation, and ensures a Runtime-compatible rule set. The injected
`DefaultSemanticWorldGenerator` is not called by the accepted async provider
branch; it is active through `DeterministicGameWorldGenerationProvider` as the
deterministic baseline/fallback and remains the synchronous compatibility path.

`gameStore.send()` then installs the returned world and semantic/gameplay
state, creates a world revision/id, loads the Runtime and generation facts into
the current Observatory store, builds the visual/asset specifications, creates
the static fallback manifest, and queues image-generation requirements.

Primary evidence:

- `apps/web/src/stores/gameStore.ts:402-467,860-963`
- `packages/ai/src/game-intent/pipeline/DefaultCreateWorldPipeline.ts:145-297`
- `packages/ai/src/game-world/generation/DeterministicGameWorldGenerationProvider.ts:10-37`

### Chain B — world evolution

For a current world, `gameStore.send()` routes an explicit evolution request,
or an unknown deterministic phrase, to `planEvolution()` when a semantic world
exists. The current Web composition injects
`DefaultWorldEvolutionPlanner` with
`StructuredWorldEvolutionCandidateProvider` and the browser structured client.

The active chain is:

`WorldEvolutionRequest` → structured candidate → parse/validate →
`DefaultSemanticWorldDeltaApplier` → `DefaultGameplayRuleReconciler` →
`DefaultRuntimeWorldEvolutionSynchronizer` →
`DefaultVisualEvolutionPlanner` → `VisualAssetEvolutionExecutor` →
current Observatory evolution record.

Revision, world-id, target-resolution, and validated-delta guards are applied
before the Runtime world is synchronized. The evolution path preserves the
existing world/session instead of silently creating a new world.

Primary evidence:

- `apps/web/src/stores/gameStore.ts:442-450,872-879,976-1090`
- `packages/ai/src/world-evolution/DefaultWorldEvolutionPlanner.ts:247-263`
- `apps/web/src/assets/VisualAssetEvolutionExecutor.ts`

### Chain C — gameplay execution

`GameViewportPanel.vue` creates a Pixi application, registers
`DefaultRuntimeSystemRegistry` with keyboard input, player control, jump,
gravity, vertical motion, ground collision, and entity contact systems, then
creates `DefaultRuntimeExecutionLoop` with the current gameplay rule config.

`DefaultRuntimeVisualizationLoop` performs each frame as:

`StoreBackedWorldProvider` → Runtime systems/rules → authoritative Runtime
result → `DefaultRuntimeRendererAdapter` → environment Renderer and
`DefaultPixiEntityRenderer` → `worldSink` → Runtime observers.

The loop writes the authoritative Runtime result before observers read it.
Runtime-owned session/progression state drives the existing failed/respawn and
completed/Victory presentation contract. The Web lifecycle overlay does not
become gameplay authority.

Primary evidence:

- `apps/web/src/components/studio/GameViewportPanel.vue:113-227`
- `packages/renderer/src/runtime/DefaultRuntimeVisualizationLoop.ts:165-201`
- `packages/runtime/src` execution-loop, system, and gameplay-rule modules

### Chain D — visual generation and regeneration

After initial generation, `gameStore.send()` builds visual and asset
specifications, creates a static asset manifest, groups generation
requirements, and schedules browser requests. The browser client targets the
AI server image-generation endpoint derived from the world-generation gateway.

The AI server exposes `/api/image-generation`, selects the configured image
provider, and publishes successful generated assets. The Web store records
operation status, updates the asset store/manifest and resolver, invalidates
render state as needed, and lets the Pixi environment/entity renderers resolve
the new asset. Primitive rendering and static URI resolution remain intentional
fallbacks when generation or decode is unavailable.

Targeted artwork regeneration during evolution uses the same lineage-aware
`VisualAssetEvolutionExecutor` and scheduler rather than a separate legacy
asset path.

Primary evidence:

- `apps/web/src/stores/gameStore.ts:474-475,525-580,901-960`
- `apps/web/src/assets/GeneratedAssetOrchestrator.ts`
- `apps/web/src/assets/VisualAssetEvolutionExecutor.ts`
- `packages/assets/src/AssetStore.ts`
- `packages/assets/src/AssetResolver.ts`
- `packages/ai-server/src/server.ts:11-64`

### Chain E — observability

The current Observatory path is:

`gameStore.send()` generation diagnostics → `observatoryDataStore.loadGenerationTrace()`;
Runtime creation/evolution → `loadRuntimeWorld()` and
`recordWorldEvolution()`; Runtime event/rule/session/progression observers →
the same store → `DefaultObservatoryAdapter` → Observatory view model →
`ObservatoryShell` and its current views.

`ObservatoryRuntimeBinding` provides a thin current-world binding from
`RuntimeWorldStore` to the Observatory data store. The current view path reads
real Runtime and generation facts. It does not require the historical
PromptBuilder metadata emitter.

The store still imports and exposes `DefaultObservatoryMetadataBridge` and
`DefaultObservatoryMapper`, and retains `loadRealObservatory()` as a
compatibility hook. Static evidence shows no current production caller of that
hook. The comments calling the bridge → mapper → adapter chain “PRIMARY PATH”
are therefore stale and are recorded as documentation/source-comment drift,
not treated as runtime truth.

Primary evidence:

- `apps/web/src/stores/observatoryData.ts:236-365`
- `apps/web/src/components/observatory/ObservatoryShell.vue`
- `apps/web/src/adapters/observatory/runtime/ObservatoryRuntimeBinding.ts`

## Subsystem disposition matrix

| Mandatory target | Disposition | Reachability finding and evidence |
| --- | --- | --- |
| `DefaultPromptBuilder` | FROZEN_LEGACY | No current Web production constructor/call site; retained through `@genesis/ai` exports, historical tests, and old documentation. Current world/gameplay/evolution prompts are separate current builders. |
| `packages/ai/src/strategy/` | FROZEN_LEGACY | No current Web production strategy resolver/selector/planner chain. Many modules describe foundation-only or historical PromptBuilder integration. Exports/tests do not establish reachability. |
| `PromptAssemblyDomainModel` | SUPPORTING | Narrow typed DTO used by current intent extraction, deterministic generation, and `DefaultCreateWorldPipeline`; its historical name does not mean the old PromptBuilder path is active. |
| Historical Prompt Assembly / Prompt Observatory metadata layers | FROZEN_LEGACY | Old metadata builder/emitter and metadata-driven Observatory route have no current production caller; retained for exports, historical tests, and compatibility. |
| Planner / `MockPlanner` / `MockPlannerProvider` / old providers | FROZEN_LEGACY | No current Web production use. `ProviderFactory` can construct `MockPlannerProvider` only for old external callers/configuration. Current provider-backed generation/evolution classes are separate and ACTIVE. |
| `DefaultPipeline` | FROZEN_LEGACY | No current Web production construction/call site; current execution uses `DefaultCreateWorldPipeline` and its async provider path. |
| `DefaultCreateWorldPipeline` / current equivalent | ACTIVE | Constructed by `gameStore.createCommandExecutor()` and invoked through the current command front door. Its async path is the current create-world pipeline. |
| World Evolution planner/parser/applier | ACTIVE | Current Web creates `DefaultWorldEvolutionPlanner`; `gameStore.planEvolution()` applies validated deltas, reconciles gameplay, synchronizes Runtime, and executes visual evolution. |
| `SemanticGameDslBuilder` | ACTIVE | `DefaultSemanticGameDslBuilder` is constructed in the current pipeline and converts current semantic output to declarative DSL. |
| Historical `GameDslBuilder` / `DefaultGameDslBuilder` | FROZEN_LEGACY | Retained as a compatibility surface; it is not the current Web constructor. |
| `SemanticWorldGenerator` | ACTIVE | `DefaultSemanticWorldGenerator` is injected into the current pipeline and is the deterministic provider’s default generator. It is active for deterministic baseline/fallback and sync compatibility; accepted async AI candidates bypass its `generate()` method. |
| `RuntimeProjection` | ACTIVE | `DefaultRuntimeProjection` is constructed by the current Web pipeline and projects current Game DSL entities/components into the Runtime World. |
| Runtime systems / execution loop | ACTIVE | Current Pixi viewport registers the input, movement, jump, gravity, motion, collision, contact, and rule execution path. Runtime owns the authoritative tick/session/progression result. |
| `renderWorld.ts` | DEAD | No current production call site; only the package barrel export remains. Current loop uses `DefaultRuntimeRendererAdapter` and Pixi renderers. Do not delete in this audit because the public export may be an external compatibility surface. |
| `MarioGameBootstrap` | FROZEN_LEGACY | Explicit one-call Mario/demo bootstrap used by its own tests and exports, not by `apps/web`; current Web composes its own provider/runtime/asset/Observatory path. |
| Current Pixi Renderer / adapters / view | ACTIVE | `GameViewportPanel` constructs `DefaultRuntimeRendererAdapter`, `PixiEnvironmentRenderer`, and `DefaultPixiEntityRenderer`; the visualization loop calls them each frame. |
| Visual generation / asset manifest / resolver | ACTIVE | Current store builds manifests and schedules initial/targeted generation; AI server and assets package provide the current transport, publication, storage, and resolution boundary. Static/primitive fallback is intentional product support. |
| Current Observatory store / adapter / Runtime binding / view-model | ACTIVE | Current store, `DefaultObservatoryAdapter`, Runtime binding, and direct generation/Runtime projection methods feed the current views. |
| Historical Observatory bridge / mapper / metadata route | FROZEN_LEGACY | `DefaultObservatoryMetadataBridge`, `DefaultObservatoryMapper`, and `loadRealObservatory()` remain compatibility surfaces but have no current production caller. |
| Mocks / fallback Observatory data | SUPPORTING | `loadMockObservatory()` reads only `globalThis.__GENESIS_OBSERVATORY_TEST_FIXTURE__`; Web test setup installs that fixture. It is test compatibility, not production Observatory authority. Deterministic generation, static asset, and primitive renderer fallbacks are ACTIVE product recovery paths, not mocks. |
| Old bootstrap/demo/test-only entry points | FROZEN_LEGACY | `DefaultGameBootstrap`, `DefaultMarioGameBootstrap`, `MarioWorldFactory`, old streaming setup, and similar entry points are retained but are not current Web composition. |
| Large historical test clusters | FROZEN_LEGACY | The AI package has 156 test files / approximately 107k test lines; Web has 41 / approximately 34k; Runtime 24 / approximately 9.6k. These clusters prove many local contracts but are not evidence that their historical production architecture is reachable. Current-path integration tests are separately identified below. |
| ADRs/docs describing dormant architecture as current | FROZEN_LEGACY | `AI_ARCHITECTURE.md` (v1.57) presents `DefaultPromptBuilder` as current/fully consumed; the AI generation matrix is v1.123; gameplay/visual matrix headers lag current freeze state. These descriptions are historical projections and require bounded correction, not runtime reconnection. |

## Prompt, strategy, and planner reachability conclusion

The historical chain:

`DefaultPromptBuilder` → `strategy/` → historical Prompt Assembly modules →
Prompt Observatory metadata → legacy bridge/mapper

is not the current generation or Observatory chain. It is still statically
visible because the package barrel exports it and because historical tests and
documents reference it. That is export/documentation reachability, not product
capability reachability.

The current prompt boundaries are:

- `DefaultGameDesignPromptBuilder` for current world candidate generation.
- `DefaultGameplayPromptBuilder` for current gameplay candidate generation.
- `DefaultWorldEvolutionPromptBuilder` for current AI world evolution.

The current provider-backed classes are therefore ACTIVE even though their
names contain “provider” rather than the historical `Planner` name. The old
`Planner`, `MockPlanner`, `RetryPlanner`, `ToolCallPlanner`, and mock/provider
factory stack is FROZEN_LEGACY.

## Mock versus intentional fallback review

| Path | Classification | Reason |
| --- | --- | --- |
| `MockPlanner`, `MockPlannerProvider`, `MockStreamingProvider` | FROZEN_LEGACY | No current Web production use; historical planner/streaming compatibility only. |
| `loadMockObservatory()` and `__GENESIS_OBSERVATORY_TEST_FIXTURE__` | SUPPORTING | Test-only fixture hook. No current production UI invocation was found. |
| `FallbackGameWorldGenerationProvider` / gameplay fallback | ACTIVE | Normal provider failure/invalid-candidate recovery. It records deterministic fallback diagnostics and supplies a playable baseline. |
| Static asset manifest / static URI resolution | ACTIVE | Deterministic visual baseline and offline/unavailable-provider support. |
| Primitive entity/environment rendering | ACTIVE | Renderer fallback when generated assets are unavailable; it is a deliberate visual degradation mode. |
| Inert Web streaming state | FROZEN_LEGACY | `gameStore` retains streaming fields for UI backward compatibility; current generation uses structured async providers and no active streaming route. |

## False-confidence and test coverage findings

The Sprint 19 heuristic is present in the current test shape:

- `packages/renderer/src/adapter/__tests__/RuntimeRendererAdapter.test.ts`
  supplies a `VelocityComponent` directly and verifies idle/run/jump mapping.
  This proves the adapter contract, but does not prove that the production
  `DefaultPlayerControllerSystem` generates the expected velocity on the real
  input path.
- `apps/web/src/__tests__/PixiRuntimeMigration.test.ts` directly constructs
  pipeline/store/provider/visual-loop objects and injects a positioned world
  with `store.setWorld()` before ticking. This proves downstream propagation,
  but it does not by itself prove that the current Studio command bar, current
  async provider/fallback selection, and current viewport composition all feed
  the same world in one product run.

These tests are useful and remain valid local regressions, but they must not be
reported as proof of full Product Capability Reachability. The current source
composition is the stronger evidence for the active chain, and the existing
real Studio records in `PROJECT_STATE.md` provide the Sprint 20–24 product
verification evidence for the currently claimed gameplay/lifecycle slice.

The active-path Web integration tests found by the audit include command
routing, gameplay generation, Studio shell, real Observatory Runtime binding,
Pixi Runtime migration, playable Runtime wiring, AI provider activation, and
world evolution. They are a narrower set than the historical package test
clusters and should be kept distinct in future reports.

## Documentation and source-comment drift

The following drift was confirmed and is corrected or recorded as part of this
audit:

| Location | Drift | Treatment in WO-S25-001 |
| --- | --- | --- |
| `docs/project/PROJECT_STATE.md` | Still points to Sprint 24 freeze decision and says Sprint 25 must not be entered. | Update current control-plane summary to record authorized Sprint 25 audit and unchanged v1.173 architecture. Historical records remain intact. |
| `docs/engineering/CURRENT_STATE.md` | Still reports Sprint 24 as current and Sprint 25 as disabled. | Update projection to WO-S25-001 and pending Sprint 25 Freeze Review. |
| `docs/engineering/WORK_QUEUE.md` | No Sprint 25 audit WO exists. | Add the single audit WO, its gap analysis, and one pending freeze-review horizon item. |
| `docs/project/CHANGELOG.md` | No Sprint 25 audit entry. | Add an audit-only entry. |
| `docs/project/AI_ARCHITECTURE.md` | v1.57 document calls historical `DefaultPromptBuilder` production/current. | Add a historical-reference banner pointing to current runtime wiring and this audit; do not rewrite history. |
| `docs/project/AI_GENERATION_CAPABILITY_MATRIX.md` | v1.123 matrix contains stale current-state claims. | Add a historical-validation banner; current v1.173 behavior remains in the authoritative state/audit docs. |
| `docs/project/GAMEPLAY_CAPABILITY_MATRIX.md` and `VISUAL_CAPABILITY_MATRIX.md` | Headers lag current frozen Sprint 24 / Sprint 25 audit state. | Add bounded state notes; do not expand capability claims. |
| `apps/web/src/stores/observatoryData.ts:284-297` | Comments describe the legacy PromptBuilder bridge as the “PRIMARY PATH”. | Record as source-comment drift; no product source change in audit-only WO. |

## Fresh Gap Analysis after WO-S25-001

### Measured result

The Sprint 25 audit acceptance condition is satisfied: the current production
chains A–E are reachable, and mandatory legacy targets have explicit
dispositions. No evidence shows that the current product depends on the old
PromptBuilder/strategy/Planner/Canvas2D/Mario path.

### Remaining gaps

1. `packages/renderer/src/renderWorld.ts` is a clear repository-level DEAD
   candidate, but its export from `packages/renderer/src/index.ts` makes
   external-consumer compatibility an unresolved deletion risk.
2. The current Observatory store still imports legacy bridge/mapper classes at
   module level even though current production calls use direct generation and
   Runtime projection methods. This is a bounded cleanup opportunity, not a
   current reachability blocker.
3. Historical docs and tests continue to make dormant architecture look active
   unless the disposition matrix and current-state banners are consulted.
4. A separate future reachability regression should drive one real command
   through the current front door and assert the downstream Runtime/Renderer
   result, rather than only injecting a downstream world. This is a test-gap
   improvement, not evidence that the current chain is broken.

### Next work-order decision

No cleanup WO is opened by this audit. The smallest apparently removable item
(`renderWorld.ts`) is not “trivial safe deletion” while it is still publicly
exported. The correct next control-plane item is:

`SPRINT25_FREEZE_REVIEW` — pending Human/CTO decision.

If a future bounded cleanup WO is authorized, the recommended order is:

1. verify package consumers for the `renderWorld` export;
2. remove or deprecate that export and file in one isolated change;
3. update renderer barrel/API tests and documentation;
4. separately consider removing the unused Observatory bridge/mapper import
   route; and
5. leave the old PromptBuilder/strategy/Planner stack for a later explicit
   compatibility decision.

## Verification record

- Current-path Web regressions: PASS — 9 files, 90 tests passed, covering
  command routing, gameplay generation, Studio shell, real Observatory Runtime
  binding, Pixi diagnostics/migration, playable Runtime wiring, provider
  activation, and world evolution.
- Direct workspace TypeScript checks: PASS for `@genesis/web`, `@genesis/ai`,
  `@genesis/runtime`, `@genesis/renderer`, `@genesis/shared`, `@genesis/assets`,
  and `@genesis/ai-server`.
- Direct workspace ESLint checks: PASS with existing warnings and zero errors.
  The warnings are concentrated in historical tests and legacy surfaces (Web
  375, AI 115, Renderer 28); Runtime, Shared, Assets, and AI Server completed
  without reported errors.
- Root `pnpm typecheck` and `pnpm lint`: blocked by Turbo's local APIClient TLS
  initialization (`No keychain is available`). This is an environment/tooling
  failure; the direct package checks passed.
- `git diff --check`: PASS.
- No build was required because this WO changed only documentation and control
  plane projections; no Web/Runtime integration source changed.

## Manual product verification guidance

No new product behavior is claimed or re-verified by this audit-only WO. For a
future human freeze review, the concise manual checks are:

1. In Studio, create a world and confirm the current command path produces a
   Runtime world visible in the Pixi viewport and World Explorer.
2. In the same world, issue an entity-scoped evolution instruction and confirm
   the world id/session remain stable while Runtime, gameplay, visual, and
   Observatory records update.
3. Use keyboard input in the viewport and confirm Runtime movement/collision
   drives the rendered result; do not infer this from an adapter-only test.
4. Inspect an initial or targeted artwork operation and confirm the current
   manifest/resolver path records provider success or an intentional fallback.
5. Open Full Observatory and confirm generation/runtime/evolution data comes
   from the current store rather than the test fixture hook.

Sprint 24's previously recorded real-Studio lifecycle checks remain the product
verification record for v1.173. WO-S25-001 itself is an audit and therefore
has Product Verified = NOT APPLICABLE.

## Audit-only boundary confirmation

- No product Runtime, Renderer, AI provider, asset, or Web behavior was changed.
- No legacy path was reconnected.
- No file was deleted.
- No mass refactor or architecture replacement was attempted.
- Architecture remains v1.173.
- Product verification for Sprint 25 is not applicable to this audit-only WO;
  Sprint 24’s previously recorded real-Studio Product Verification remains
  YES.
