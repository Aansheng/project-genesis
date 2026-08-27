/**
 * gameStore — the Pinia store for the Project Genesis game UI.
 *
 * Routes user commands through the CommandExecutor chain:
 *   StudioCommandBar.vue → send() → DefaultCommandExecutor
 *     → IntentRouter → CreateWorldRuntimeExecutor
 *       → CreateWorldPipeline → RuntimeWorldStore
 *
 * Architecture (WO-S10-004):
 * - Replaced legacy MockPlanner + DefaultPipeline with CommandExecutor
 * - World source changed from Runtime.world to RuntimeWorldStore
 * - All streaming state preserved as inert UI (toggle continues to render)
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { Runtime, DefaultRuntimeWorldStore, DefaultRuntimeWorldEvolutionSynchronizer, DefaultRuntimeGameplayEventCollector } from '@genesis/runtime'
import type { RuntimeGameplaySessionState, RuntimeWorldStore } from '@genesis/runtime'
import { DefaultAssetResolver, DefaultAssetStore } from '@genesis/assets'
import type { AssetManifest, GameplayRuleReconciliationResult, GameplayRuleSet, GameplaySpecification, ImageGenerationContext, ImageGenerationOperation, AssetSpecification, GameDesignSpecification, GameWorldModel, VisualDesignSpecification, VisualEvolutionPlan, VisualAssetExecutionResult, WorldEvolutionEvent, WorldEvolutionRequest, WorldEvolutionStage, WorldSemanticProperties, SemanticWorldMutationResult, RuntimeEvolutionResult, WorldEvolutionOperation } from '@genesis/shared'
import { bindGameplayRuleSet, DefaultImageGenerationContextBuilder, DefaultSemanticWorldDeltaApplier } from '@genesis/shared'
import { DefaultIntentRouter, DefaultGameIntentExtractor, DefaultCreateWorldPipeline, DefaultCreateWorldRuntimeExecutor, DefaultSemanticWorldGenerator, DefaultSemanticGameDslBuilder, DefaultVisualDesignSpecificationBuilder, DefaultAssetSpecificationBuilder, createAIConfiguration, DeterministicGameWorldGenerationProvider, DefaultGameWorldValidator, GameWorldGenerationProviderAdapter, LLMGameWorldGenerationCandidateProvider, FallbackGameWorldGenerationProvider, DefaultWorldEvolutionPlanner, StructuredWorldEvolutionCandidateProvider, DefaultGameplaySpecificationBuilder, DefaultGameplaySpecificationValidator, DeterministicGameplayGenerationProvider, DefaultGameplayRuleReconciler, GameplayGenerationProviderAdapter, FallbackGameplayGenerationProvider, LLMGameplayGenerationCandidateProvider } from '@genesis/ai'
import type { GameWorldGenerationProvider, GameplayGenerationProvider, WorldEvolutionPlanResult, WorldEvolutionPlanner } from '@genesis/ai'
import { DefaultRuntimeProjection } from '@genesis/runtime'
import { DefaultAssetManifestBuilder } from '@genesis/shared'
import { DefaultCommandExecutor } from '../command'
import type { CommandExecutionResult, CommandExecutor } from '../command'
import { BrowserStructuredGenerationClient } from '../ai/BrowserStructuredGenerationClient'
import { BrowserImageGenerationClient } from '../ai/BrowserImageGenerationClient'
import { buildImageGenerationRequest, groupAiGenerationRequirements } from '../assets/AssetGenerationPolicy'
import { buildGeneratedAssetManifest, createPendingImageGenerationOperation, finishImageGenerationOperation } from '../assets/GeneratedAssetOrchestrator'
import { VisualAssetGenerationScheduler } from '../assets/VisualAssetGenerationScheduler'
import { DefaultVisualEvolutionPlanner } from '../assets/VisualEvolutionPlanner'
import { VisualAssetEvolutionExecutor } from '../assets/VisualAssetEvolutionExecutor'
import type { VisualAssetExecutionProgress, VisualAssetExecutionStage } from '../assets/VisualAssetEvolutionExecutor'
import { useObservatoryDataStore } from './observatoryData'
import { createStaticAssetResolutions } from '../assets/StaticAssetCatalog'
import { PROJECT_METADATA } from '../projectMetadata'

export type CommandStatus = 'idle' | 'running' | 'success' | 'error'

const EMPTY_ASSET_MANIFEST: AssetManifest = Object.freeze({ entries: Object.freeze([]) })
const EMPTY_SEMANTIC_PROPERTIES: WorldSemanticProperties = Object.freeze({})

function buildVisualDesignSpecification(
  specification: GameDesignSpecification | undefined,
): VisualDesignSpecification | undefined {
  if (!specification) return undefined
  return new DefaultVisualDesignSpecificationBuilder().build(specification)
}

function buildAssetSpecification(
  specification: GameDesignSpecification | undefined,
): AssetSpecification | undefined {
  const visual = buildVisualDesignSpecification(specification)
  return visual ? new DefaultAssetSpecificationBuilder().build(visual) : undefined
}

function buildStaticAssetManifest(
  specification: GameDesignSpecification | undefined,
): AssetManifest {
  const assets = buildAssetSpecification(specification)
  if (!assets) return EMPTY_ASSET_MANIFEST
  return new DefaultAssetManifestBuilder().build(
    assets,
    createStaticAssetResolutions(assets.assets),
  )
}

const DEFAULT_AI_GATEWAY_URL = 'http://127.0.0.1:8787/api/world-generation'

interface CurrentSemanticWorldState {
  readonly worldId: string
  readonly semanticWorld: GameWorldModel | null
  readonly properties: WorldSemanticProperties
  readonly semanticRevision: number
}

function freezeSemanticState(state: CurrentSemanticWorldState): CurrentSemanticWorldState {
  return Object.freeze({
    ...state,
    properties: Object.freeze({ ...state.properties }),
  })
}

function withSemanticApplication(
  plan: Extract<WorldEvolutionPlanResult, { readonly status: 'validated' }>,
  mutation: SemanticWorldMutationResult,
): Extract<WorldEvolutionPlanResult, { readonly status: 'validated' }> {
  const startedAt = new Date().toISOString()
  const completedAt = new Date().toISOString()
  const applied = mutation.status === 'applied'
  const stages: readonly WorldEvolutionStage[] = Object.freeze([
    ...plan.operation.stages,
    Object.freeze({ name: 'SEMANTIC_APPLICATION_STARTED' as const, status: 'success' as const, timestamp: startedAt }),
    Object.freeze({
      name: applied ? 'SEMANTIC_APPLICATION_COMPLETED' : 'SEMANTIC_APPLICATION_FAILED',
      status: applied ? 'success' : 'failed',
      timestamp: completedAt,
      ...(mutation.failureReason ? { error: mutation.failureReason } : {}),
    }),
  ])
  const events: readonly WorldEvolutionEvent[] = Object.freeze([
    ...plan.operation.events.map(event => event.type === 'world.evolution.semantic_applied'
      ? Object.freeze({ ...event, message: 'Semantic world mutation applied; Runtime synchronization started' })
      : event),
    Object.freeze({
      id: `${plan.operation.operationId}:semantic_application_started`,
      operationId: plan.operation.operationId,
      worldId: plan.operation.worldId,
      type: 'world.evolution.semantic_application_started' as const,
      timestamp: startedAt,
      message: 'Semantic world application started',
    }),
    Object.freeze({
      id: `${plan.operation.operationId}:${applied ? 'semantic_applied' : 'semantic_application_failed'}`,
      operationId: plan.operation.operationId,
      worldId: plan.operation.worldId,
      type: applied ? 'world.evolution.semantic_applied' : 'world.evolution.semantic_application_failed',
      timestamp: completedAt,
      message: applied ? 'Semantic world mutation applied; Runtime synchronization started' : `Semantic world mutation failed: ${mutation.failureReason ?? 'unknown error'}`,
    }),
  ])
  const operation = Object.freeze({
    ...plan.operation,
    status: applied ? 'semantic_applied' as const : 'semantic_application_failed' as const,
    completedAt,
    semanticRevision: applied ? mutation.updatedRevision : mutation.previousRevision,
    ...(applied ? {} : { failureReason: mutation.failureReason ?? 'invalid_delta' }),
    stages,
    events,
  })
  return Object.freeze({ ...plan, operation, mutation })
}

function withGameplayReconciliation(
  plan: Extract<WorldEvolutionPlanResult, { readonly status: 'validated' }>,
  reconciliation: GameplayRuleReconciliationResult,
): Extract<WorldEvolutionPlanResult, { readonly status: 'validated' }> {
  const startedAt = new Date().toISOString()
  const completedAt = new Date().toISOString()
  const failed = reconciliation.status === 'failed'
  const stages: readonly WorldEvolutionStage[] = Object.freeze([
    ...plan.operation.stages,
    Object.freeze({ name: 'GAMEPLAY_RECONCILIATION_STARTED' as const, status: 'success' as const, timestamp: startedAt }),
    Object.freeze({
      name: failed ? 'GAMEPLAY_RECONCILIATION_FAILED' : 'GAMEPLAY_RECONCILIATION_COMPLETED',
      status: failed ? 'failed' : 'success',
      timestamp: completedAt,
      ...(reconciliation.failureReason ? { error: reconciliation.failureReason } : {}),
    }),
  ])
  const events: readonly WorldEvolutionEvent[] = Object.freeze([
    ...plan.operation.events,
    Object.freeze({
      id: `${plan.operation.operationId}:gameplay_reconciliation_started`,
      operationId: plan.operation.operationId,
      worldId: plan.operation.worldId,
      type: 'world.evolution.gameplay_reconciliation_started' as const,
      timestamp: startedAt,
      message: 'Gameplay Rule reconciliation started',
    }),
    Object.freeze({
      id: `${plan.operation.operationId}:${failed ? 'gameplay_reconciliation_failed' : 'gameplay_reconciliation_completed'}`,
      operationId: plan.operation.operationId,
      worldId: plan.operation.worldId,
      type: failed ? 'world.evolution.gameplay_reconciliation_failed' as const : 'world.evolution.gameplay_reconciliation_completed' as const,
      timestamp: completedAt,
      message: failed
        ? `Gameplay Rule reconciliation failed: ${reconciliation.failureReason ?? 'unknown error'}`
        : `Gameplay Rule reconciliation completed: ${reconciliation.rebuiltRuleIds.length} rebuilt, ${reconciliation.revalidatedRuleIds.length} revalidated, ${reconciliation.preservedRuleIds.length} preserved, ${reconciliation.removedRuleIds.length} removed`,
    }),
  ])
  const operation = Object.freeze({
    ...plan.operation,
    ...(failed ? { status: 'gameplay_reconciliation_failed' as const } : {}),
    gameplayReconciliation: failed ? 'failed' as const : 'reconciled' as const,
    gameplayRuleSetRevision: reconciliation.semanticRevision,
    gameplayRulesPreserved: reconciliation.preservedRuleIds.length,
    gameplayRulesRevalidated: reconciliation.revalidatedRuleIds.length,
    gameplayRulesRebuilt: reconciliation.rebuiltRuleIds.length,
    gameplayRulesRemoved: reconciliation.removedRuleIds.length,
    gameplayRulesDeferred: reconciliation.deferredRuleIds.length,
    ...(failed ? { failureReason: reconciliation.failureReason ?? 'gameplay_rule_reconciliation_failed' } : {}),
    completedAt,
    stages,
    events,
  })
  return Object.freeze({ ...plan, operation, gameplayReconciliation: reconciliation })
}

function withRuntimeSynchronization(
  plan: Extract<WorldEvolutionPlanResult, { readonly status: 'validated' }>,
  runtimeSync: RuntimeEvolutionResult,
): Extract<WorldEvolutionPlanResult, { readonly status: 'validated' }> {
  const startedAt = new Date().toISOString()
  const completedAt = new Date().toISOString()
  const failed = runtimeSync.status === 'failed'
  const stages: readonly WorldEvolutionStage[] = Object.freeze([
    ...plan.operation.stages,
    Object.freeze({ name: 'RUNTIME_SYNC_STARTED' as const, status: 'success' as const, timestamp: startedAt }),
    Object.freeze({
      name: failed ? 'RUNTIME_SYNC_FAILED' : 'RUNTIME_SYNC_COMPLETED',
      status: failed ? 'failed' : 'success',
      timestamp: completedAt,
      ...(runtimeSync.failureReason ? { error: runtimeSync.failureReason } : {}),
    }),
  ])
  const events: readonly WorldEvolutionEvent[] = Object.freeze([
    ...plan.operation.events,
    Object.freeze({
      id: `${plan.operation.operationId}:runtime_sync_started`,
      operationId: plan.operation.operationId,
      worldId: plan.operation.worldId,
      type: 'world.evolution.runtime_sync_started' as const,
      timestamp: startedAt,
      message: 'Runtime synchronization started',
    }),
    Object.freeze({
      id: `${plan.operation.operationId}:${failed ? 'runtime_sync_failed' : 'runtime_synced'}`,
      operationId: plan.operation.operationId,
      worldId: plan.operation.worldId,
      type: failed ? 'world.evolution.runtime_sync_failed' as const : 'world.evolution.runtime_synced' as const,
      timestamp: completedAt,
      message: failed
        ? `Runtime synchronization failed: ${runtimeSync.failureReason ?? 'unknown error'}`
        : runtimeSync.status === 'no_runtime_impact'
          ? 'Runtime synchronization completed; no Runtime field was affected'
          : runtimeSync.status === 'already_applied'
            ? 'Runtime synchronization already applied; no duplicate mutation committed'
            : 'Runtime synchronization completed',
    }),
  ])
  const operation = Object.freeze({
    ...plan.operation,
    status: failed ? 'runtime_sync_failed' as const : 'runtime_synchronized' as const,
    completedAt,
    runtimeSemanticRevision: runtimeSync.updatedRevision,
    runtimeSynchronization: failed
      ? 'failed' as const
      : runtimeSync.runtimeImpact === 'none' ? 'no_runtime_impact' as const : 'synchronized' as const,
    ...(failed ? { failureReason: runtimeSync.failureReason ?? 'runtime_sync_failed' } : {}),
    stages,
    events,
  })
  return Object.freeze({ ...plan, operation, runtimeSync })
}

function withVisualPlanning(
  plan: Extract<WorldEvolutionPlanResult, { readonly status: 'validated' }>,
  visualPlan: VisualEvolutionPlan,
): Extract<WorldEvolutionPlanResult, { readonly status: 'validated' }> {
  const startedAt = new Date().toISOString()
  const completedAt = new Date().toISOString()
  const failed = visualPlan.status === 'failed'
  const stages: readonly WorldEvolutionStage[] = Object.freeze([
    ...plan.operation.stages,
    Object.freeze({ name: 'VISUAL_IMPACT_STARTED' as const, status: 'success' as const, timestamp: startedAt }),
    Object.freeze({
      name: failed ? 'VISUAL_DELTA_FAILED' : 'VISUAL_DELTA_PLANNED',
      status: failed ? 'failed' : 'success',
      timestamp: completedAt,
      ...(visualPlan.failureReason ? { error: visualPlan.failureReason } : {}),
    }),
  ])
  const events: readonly WorldEvolutionEvent[] = Object.freeze([
    ...plan.operation.events,
    Object.freeze({
      id: `${plan.operation.operationId}:visual_impact_started`,
      operationId: plan.operation.operationId,
      worldId: plan.operation.worldId,
      type: 'world.evolution.visual_impact_started' as const,
      timestamp: startedAt,
      message: 'Visual impact analysis started',
    }),
    Object.freeze({
      id: `${plan.operation.operationId}:${failed ? 'visual_delta_failed' : 'visual_delta_planned'}`,
      operationId: plan.operation.operationId,
      worldId: plan.operation.worldId,
      type: failed ? 'world.evolution.visual_delta_failed' as const : 'world.evolution.visual_delta_planned' as const,
      timestamp: completedAt,
      message: failed
        ? `Visual delta planning failed: ${visualPlan.failureReason ?? 'unknown error'}`
        : visualPlan.generationRequired.length > 0
          ? `Visual delta planned; ${visualPlan.generationRequired.length} canonical visual generation requirement(s) pending`
          : 'Visual delta planned; no asset generation required',
    }),
  ])
  const operation = Object.freeze({
    ...plan.operation,
    status: failed ? 'visual_planning_failed' as const : 'visual_delta_planned' as const,
    completedAt,
    visualRevision: visualPlan.updatedVisualRevision,
    visualPlanning: failed
      ? 'failed' as const
      : visualPlan.status === 'no_visual_impact' ? 'no_visual_impact' as const : 'planned' as const,
    visualGenerationRequired: visualPlan.generationRequired.length,
    ...(failed ? { failureReason: visualPlan.failureReason ?? 'visual_planning_failed' } : {}),
    stages,
    events,
  })
  return Object.freeze({ ...plan, operation, visualPlan })
}

function withAssetExecutionProgress(
  plan: Extract<WorldEvolutionPlanResult, { readonly status: 'validated' }>,
  progress: VisualAssetExecutionProgress,
): Extract<WorldEvolutionPlanResult, { readonly status: 'validated' }> {
  const startedAt = new Date().toISOString()
  const statusByStage: Record<VisualAssetExecutionStage, WorldEvolutionOperation['status']> = {
    ASSET_EXECUTION_STARTED: 'asset_execution_started',
    ASSET_GENERATION_STARTED: 'asset_generation_started',
    ASSET_GENERATED: 'asset_generated',
    MANIFEST_REBOUND: 'manifest_rebound',
    ASSET_RESOLVED: 'asset_resolved',
    RENDERER_APPLIED: 'renderer_applied',
    VISUAL_SYNC_COMPLETED: 'visual_sync_completed',
    VISUAL_SYNC_FAILED: 'visual_sync_failed',
  }
  const eventTypes: Partial<Record<VisualAssetExecutionStage, WorldEvolutionEvent['type']>> = {
    ASSET_EXECUTION_STARTED: 'world.evolution.asset_execution_started',
    ASSET_GENERATION_STARTED: 'world.evolution.asset_generation_started',
    ASSET_GENERATED: 'world.evolution.asset_generated',
    MANIFEST_REBOUND: 'world.evolution.manifest_rebound',
    RENDERER_APPLIED: 'world.evolution.renderer_applied',
    VISUAL_SYNC_COMPLETED: 'world.evolution.visual_sync_completed',
    VISUAL_SYNC_FAILED: 'world.evolution.visual_sync_failed',
  }
  const isFailure = progress.stage === 'VISUAL_SYNC_FAILED'
  const stages: readonly WorldEvolutionStage[] = Object.freeze([
    ...plan.operation.stages,
    Object.freeze({
      name: progress.stage,
      status: isFailure ? 'failed' as const : 'success' as const,
      timestamp: startedAt,
      ...(progress.message && isFailure ? { error: progress.message } : {}),
    }),
  ])
  const eventType = eventTypes[progress.stage]
  const events: readonly WorldEvolutionEvent[] = eventType
    ? Object.freeze([
      ...plan.operation.events,
      Object.freeze({
        id: `${plan.operation.operationId}:${progress.stage}:${plan.operation.events.length}`,
        operationId: plan.operation.operationId,
        worldId: plan.operation.worldId,
        type: eventType,
        timestamp: startedAt,
        message: progress.message ?? `${progress.stage}${progress.canonicalAssetId ? `: ${progress.canonicalAssetId}` : ''}`,
      }),
    ])
    : plan.operation.events
  const status = statusByStage[progress.stage]
  const operation = Object.freeze({
    ...plan.operation,
    status,
    completedAt: startedAt,
    assetExecution: isFailure ? 'failed' as const : progress.stage === 'VISUAL_SYNC_COMPLETED' ? 'completed' as const : 'running' as const,
    visualSynchronization: isFailure ? 'previous_retained' as const : progress.stage === 'VISUAL_SYNC_COMPLETED' ? 'synchronized' as const : 'pending' as const,
    ...(progress.stage === 'ASSET_GENERATION_STARTED' ? { assetGenerationStarted: (plan.operation.assetGenerationStarted ?? 0) + 1 } : {}),
    ...(progress.stage === 'ASSET_GENERATED' ? { assetGenerated: (plan.operation.assetGenerated ?? 0) + 1 } : {}),
    ...(progress.stage === 'MANIFEST_REBOUND' ? {
      assetRebound: (plan.operation.assetRebound ?? 0) + (progress.assetIds?.length ?? 0),
    } : {}),
    ...(progress.stage === 'VISUAL_SYNC_FAILED' ? { failureReason: progress.message ?? 'visual_sync_failed' } : {}),
    stages,
    events,
  })
  return Object.freeze({ ...plan, operation })
}

function withAssetExecutionResult(
  plan: Extract<WorldEvolutionPlanResult, { readonly status: 'validated' }>,
  result: VisualAssetExecutionResult,
): Extract<WorldEvolutionPlanResult, { readonly status: 'validated' }> {
  const status: WorldEvolutionOperation['status'] = result.status === 'failed' || result.status === 'stale'
    ? 'visual_sync_failed'
    : result.status === 'already_synced'
      ? 'asset_execution_already_synced'
      : result.status === 'manifest_rebound'
        ? 'manifest_rebound'
        : 'visual_sync_completed'
  const operation = Object.freeze({
    ...plan.operation,
    status,
    assetExecution: result.status === 'stale' ? 'stale' as const : result.status === 'already_synced' ? 'already_synced' as const : result.status === 'failed' ? 'failed' as const : result.status === 'manifest_rebound' ? 'running' as const : 'completed' as const,
    visualSynchronization: result.status === 'failed' || result.status === 'stale' ? 'previous_retained' as const : result.status === 'manifest_rebound' ? 'pending' as const : 'synchronized' as const,
    assetGenerated: result.generatedCanonicalAssetIds.length,
    assetManifestRevision: result.manifestRevision,
    assetRebound: result.reboundAssetIds.length,
    assetRemoved: result.removedAssetIds.length,
    assetRendererApplied: result.rendererAppliedEntityIds.length,
    ...(result.failureReason ? { failureReason: result.failureReason } : {}),
    visualExecution: result,
  })
  return Object.freeze({ ...plan, operation, visualExecution: result })
}

function imageGatewayURL(gatewayURL: string): string {
  return gatewayURL.replace(/\/api\/world-generation\/?$/u, '/api/image-generation')
}

export function createCommandExecutor(
  worldStore: RuntimeWorldStore,
  env: Record<string, string | undefined> = import.meta.env,
  fetcher: typeof fetch = globalThis.fetch.bind(globalThis),
): { executor: CommandExecutor; useAsync: boolean; evolutionPlanner?: WorldEvolutionPlanner } {
  const configuration = createAIConfiguration(env)
  const deterministicProvider = new DeterministicGameWorldGenerationProvider()
  const deterministicGameplayProvider: GameplayGenerationProvider = new DeterministicGameplayGenerationProvider(new DefaultGameplaySpecificationBuilder())
  let generationProvider: GameWorldGenerationProvider = deterministicProvider
  let gameplayProvider: GameplayGenerationProvider = deterministicGameplayProvider
  let useAsync = false
  let evolutionPlanner: WorldEvolutionPlanner | undefined

  // The server owns runtime provider availability. The browser always uses the
  // gateway when one is known; unavailable/disabled server state is handled by
  // the existing deterministic fallback instead of a stale build-time flag.
  const gatewayURL = configuration.gatewayURL || DEFAULT_AI_GATEWAY_URL
  if (gatewayURL) {
    try {
      const modelProvider = new GameWorldGenerationProviderAdapter(
        new LLMGameWorldGenerationCandidateProvider(new BrowserStructuredGenerationClient(gatewayURL, fetcher), undefined, {
          maxOutputTokens: configuration.maxOutputTokens ?? 4000,
          timeoutMs: configuration.timeoutMs ?? 30000,
          maxAttempts: configuration.maxAttempts ?? 2,
        }),
        new DefaultGameWorldValidator(),
      )
      generationProvider = new FallbackGameWorldGenerationProvider(modelProvider, deterministicProvider)
      gameplayProvider = new FallbackGameplayGenerationProvider(
        new GameplayGenerationProviderAdapter(
          new LLMGameplayGenerationCandidateProvider(new BrowserStructuredGenerationClient(gatewayURL, fetcher), undefined, {
            maxOutputTokens: configuration.maxOutputTokens ?? 4000,
            timeoutMs: configuration.timeoutMs ?? 30000,
            maxAttempts: configuration.maxAttempts ?? 2,
          }),
          new DefaultGameplaySpecificationValidator(),
          new DefaultGameplaySpecificationBuilder(),
        ),
        deterministicGameplayProvider,
      )
      evolutionPlanner = new DefaultWorldEvolutionPlanner(
        new StructuredWorldEvolutionCandidateProvider(
          new BrowserStructuredGenerationClient(gatewayURL, fetcher),
          {
            maxOutputTokens: configuration.maxOutputTokens ?? 4000,
            timeoutMs: configuration.timeoutMs ?? 30000,
          },
        ),
      )
      useAsync = true
    } catch {
      // Missing browser permission or invalid configuration keeps the app deterministic.
    }
  }

  const pipeline = new DefaultCreateWorldPipeline(
    new DefaultIntentRouter(),
    new DefaultGameIntentExtractor(),
    new DefaultSemanticWorldGenerator(),
    new DefaultSemanticGameDslBuilder(),
    new DefaultRuntimeProjection(),
    generationProvider,
    gameplayProvider,
  )
  const createWorldExecutor = new DefaultCreateWorldRuntimeExecutor(pipeline, worldStore)
  return { executor: new DefaultCommandExecutor(new DefaultIntentRouter(), createWorldExecutor), useAsync, evolutionPlanner }
}

export const useGameStore = defineStore('game', () => {
  const runtime = new Runtime()
  const gameplayEventCollector = new DefaultRuntimeGameplayEventCollector()
  const worldStore: RuntimeWorldStore = new DefaultRuntimeWorldStore(runtime.world, gameplayEventCollector)
  const assetStore = new DefaultAssetStore(new DefaultAssetResolver())
  const assetManifest = ref<AssetManifest>(EMPTY_ASSET_MANIFEST)
  const assetManifestRevision = ref(0)
  const visualDesignSpecification = ref<VisualDesignSpecification | null>(null)
  const assetSpecificationState = ref<AssetSpecification | null>(null)
  const renderVersion = ref(0)
  const worldRevision = ref(0)
  const semanticState = ref<CurrentSemanticWorldState | null>(null)
  const gameplaySpecificationState = ref<GameplaySpecification | null>(null)
  const gameplayRuleSetState = ref<GameplayRuleSet | null>(null)
  // This is a Web projection of Runtime-owned session truth. The Runtime
  // execution observer is its only production writer; no UI action mutates it.
  const gameplaySessionState = ref<RuntimeGameplaySessionState>(Object.freeze({ status: 'active' }))
  const currentWorldId = computed(() => semanticState.value?.worldId ?? '')
  const semanticWorld = computed(() => semanticState.value?.semanticWorld ?? null)
  const semanticProperties = computed<WorldSemanticProperties>(() => semanticState.value?.properties ?? EMPTY_SEMANTIC_PROPERTIES)
  const semanticRevision = computed(() => semanticState.value?.semanticRevision ?? 0)
  const semanticWorldDeltaApplier = new DefaultSemanticWorldDeltaApplier()
  const gameplayRuleReconciler = new DefaultGameplayRuleReconciler()
  const runtimeWorldEvolutionSynchronizer = new DefaultRuntimeWorldEvolutionSynchronizer()
  const visualEvolutionPlanner = new DefaultVisualEvolutionPlanner()
  const runtimeSemanticRevision = ref(0)
  const runtimeSyncWorldId = ref('')
  const lastRuntimeSyncOperationId = ref<string | null>(null)
  const visualRevision = ref(0)
  const lastVisualPlanOperationId = ref<string | null>(null)
  const selectedEntityId = ref<string | null>(null)
  const log = ref<string[]>([])
  const commandStatus = ref<CommandStatus>('idle')
  const lastCommand = ref<import('../command').CommandExecutionResult | null>(null)
  const visualGenerationOperations = ref<Record<string, ImageGenerationOperation>>({})
  type ValidatedEvolution = Extract<WorldEvolutionPlanResult, { readonly status: 'validated' }>
  interface ActiveVisualExecution {
    plan: ValidatedEvolution
    imageOperationIds: Set<string>
    appliedEntityIds: Set<string>
    completedImageOperationIds: Set<string>
    result?: VisualAssetExecutionResult
  }
  const activeVisualExecutions = new Map<string, ActiveVisualExecution>()
  const pendingAssetReplacements = new Map<string, { readonly manifest: AssetManifest; readonly revision: number }>()
  const imageGenerationOperation = computed<ImageGenerationOperation | null>(() => {
    const operations = Object.values(visualGenerationOperations.value)
    return operations.find(operation => operation.stage === 'generating' || operation.stage === 'applying')
      ?? operations.at(-1)
      ?? null
  })
  let imageGenerationToken = 0
  let imageGenerationRetrySequence = 0
  let evolutionOperationSequence = 0
  const visualAssetJobCancellation: { cancel?: (jobId: string) => void } = {}
  const scheduler = new VisualAssetGenerationScheduler<unknown>(1, (jobId, status) => {
    if (status === 'cancelled') visualAssetJobCancellation.cancel?.(jobId)
    const operation = visualGenerationOperations.value[jobId]
    if (!operation || status === 'completed' || status === 'cancelled') return
    setOperation({ ...operation, status: status === 'queued' ? 'queued' : 'running', stage: status === 'queued' ? 'queued' : 'generating' })
  })

  function setOperation(operation: ImageGenerationOperation): void {
    visualGenerationOperations.value = { ...visualGenerationOperations.value, [operation.operationId]: operation }
  }

  function cancelSupersededVisualOperations(): void {
    for (const operation of Object.values(visualGenerationOperations.value)) {
      if (operation.stage === 'ready' || operation.stage === 'fallback' || operation.stage === 'cancelled') continue
      setOperation(finishImageGenerationOperation(operation, {
        status: 'cancelled',
        stage: 'cancelled',
        outcome: 'generation_failed_fallback',
        fallback: 'static',
        failure: { code: 'stale_operation', message: 'Visual generation superseded by newer world evolution' },
      }))
    }
  }

  // --- Streaming UI state (inert — preserved for UI backward compatibility) ---
  const isStreaming = ref(false)
  const streamingText = ref('')
  const streamingFinished = ref(false)
  const useStreaming = ref(false)

  const { executor: commandExecutor, useAsync: useAsyncGeneration, evolutionPlanner } = createCommandExecutor(worldStore)
  const imageClient = new BrowserImageGenerationClient(imageGatewayURL(
    createAIConfiguration(import.meta.env).gatewayURL || DEFAULT_AI_GATEWAY_URL,
  ))
  const imageGenerationContextBuilder = new DefaultImageGenerationContextBuilder()
  const visualAssetEvolutionExecutor = new VisualAssetEvolutionExecutor({
    imageClient,
    scheduler,
    assetStore,
    isCurrent: context => context.token === imageGenerationToken
      && context.worldId === currentWorldId.value
      && context.semanticRevision === semanticRevision.value
      && context.visualRevision === visualRevision.value
      && (context.runtimeSemanticRevision === undefined || context.runtimeSemanticRevision === runtimeSemanticRevision.value),
    onOperation: operation => {
      const activeOperationId = [...activeVisualExecutions.keys()].find(operationId =>
        operation.operationId.startsWith(`image-generation-client-${operationId}-`),
      )
      if (operation.operationId.startsWith('image-generation-client-') && !activeOperationId) return
      setOperation(operation)
      if (activeOperationId) {
        const execution = activeVisualExecutions.get(activeOperationId)!
        execution.imageOperationIds.add(operation.operationId)
      }
    },
    onProgress: progress => {
      const execution = activeVisualExecutions.get(progress.operationId)
      if (!execution) return
      execution.plan = withAssetExecutionProgress(execution.plan, progress)
      if (execution.plan.operation.worldId === currentWorldId.value) useObservatoryDataStore().recordWorldEvolution(execution.plan)
    },
    onManifestCommitted: change => {
      if (!activeVisualExecutions.has(change.operationId)) return
      assetManifest.value = change.manifest
      assetManifestRevision.value = change.manifestRevision
      markWorldUpdated()
    },
  })
  visualAssetJobCancellation.cancel = jobId => visualAssetEvolutionExecutor.cancelJob(jobId)

  const selectedEntity = computed(() => {
    renderVersion.value
    const id = selectedEntityId.value
    return id === null
      ? null
      : worldStore.getWorld().entities.find((entity) => entity.id === id) ?? null
  })

  function selectEntity(id: string): void {
    selectedEntityId.value = worldStore.getWorld().entities.some(
      (entity) => entity.id === id,
    )
      ? id
      : null
  }

  function markWorldUpdated(): void {
    renderVersion.value++
    if (
      selectedEntityId.value !== null &&
      !worldStore.getWorld().entities.some(
        (entity) => entity.id === selectedEntityId.value,
      )
    ) {
      selectedEntityId.value = null
    }
  }

  function recordRuntimeGameplaySessionState(state: RuntimeGameplaySessionState): void {
    gameplaySessionState.value = Object.freeze({ ...state })
  }

  async function generateArtwork(specification: AssetSpecification, requirements: readonly [import('@genesis/shared').AssetRequirement, readonly import('@genesis/shared').AssetRequirement[]], generationContext: ImageGenerationContext, token: number, retry?: { readonly operationId: string; readonly retryOfOperationId: string; readonly prompt?: string }): Promise<void> {
    const [requirement, bindings] = requirements
    const builtRequest = buildImageGenerationRequest(specification, requirement, generationContext)
    const request = retry?.prompt?.trim() ? Object.freeze({ ...builtRequest, prompt: retry.prompt.trim() }) : builtRequest
    const pending = { ...createPendingImageGenerationOperation(request), ...(retry ? { operationId: retry.operationId, retryOfOperationId: retry.retryOfOperationId } : {}) }
    if (retry) pendingAssetReplacements.set(pending.operationId, { manifest: assetManifest.value, revision: assetManifestRevision.value })
    try {
      const result = await imageClient.generate(request)
      if (token !== imageGenerationToken) {
        pendingAssetReplacements.delete(pending.operationId)
        return
      }
      if (result.status !== 'success') {
        const providerOperation = result.operation ?? pending
        setOperation(finishImageGenerationOperation({
          ...pending,
          ...providerOperation,
          operationId: pending.operationId,
          entityId: request.entityId,
          assetKind: request.constraints?.assetKind,
          input: providerOperation.input,
          bindingAssetIds: bindings.map(binding => binding.id),
          bindingEntityIds: bindings.flatMap(binding => binding.entityId ? [binding.entityId] : []),
        }, {
          status: 'failed',
          stage: 'fallback',
          artifactStatus: 'failed',
          outcome: 'generation_failed_fallback',
          fallback: 'static',
          failure: result.failure,
        }))
        pendingAssetReplacements.delete(pending.operationId)
        return
      }
      const providerOperation = result.operation ?? pending
      setOperation({
        ...pending,
        ...providerOperation,
        operationId: pending.operationId,
        entityId: request.entityId,
        assetKind: request.constraints?.assetKind,
        status: 'running',
        stage: 'applying',
        artifactStatus: providerOperation.artifactStatus ?? 'published',
        manifestStatus: 'updated',
        assetResolutionStatus: 'pending',
        rendererStatus: 'pending',
        fallback: 'static',
        bindingAssetIds: bindings.map(binding => binding.id),
        bindingEntityIds: bindings.flatMap(binding => binding.entityId ? [binding.entityId] : []),
      })
      assetStore.invalidate(result.assetId)
      for (const binding of bindings) assetStore.invalidate(binding.id)
      assetManifest.value = buildGeneratedAssetManifest(specification, assetManifest.value, result, bindings.map(binding => binding.id))
      markWorldUpdated()
    } catch (error) {
      if (token !== imageGenerationToken) {
        pendingAssetReplacements.delete(pending.operationId)
        return
      }
      setOperation(finishImageGenerationOperation(pending, {
        status: 'failed',
        stage: 'fallback',
        artifactStatus: 'failed',
        outcome: 'generation_failed_fallback',
        fallback: 'static',
        failure: { code: 'provider_unavailable', message: error instanceof Error ? error.message : 'Image generation unavailable' },
      }))
      pendingAssetReplacements.delete(pending.operationId)
    }
  }

  async function regenerateArtwork(previousOperationId: string, prompt?: string): Promise<void> {
    const previous = visualGenerationOperations.value[previousOperationId]
    const specification = assetSpecificationState.value
    const design = visualDesignSpecification.value
    const state = semanticState.value
    if (!previous || !specification || !design || !state?.semanticWorld) return
    const requirements = groupAiGenerationRequirements(specification).find(([canonical]) => canonical.id === previous.assetId)
    if (!requirements) return
    const [requirement, bindings] = requirements
    const retryOperationId = `image-generation-client-retry-${++imageGenerationRetrySequence}-${requirement.id}`
    const generationContext = imageGenerationContextBuilder.build({
      metadata: { worldId: state.worldId, operationId: retryOperationId, semanticRevision: state.semanticRevision, runtimeSemanticRevision: runtimeSemanticRevision.value, visualRevision: visualRevision.value, architectureVersion: PROJECT_METADATA.architectureVersion },
      semanticWorld: state.semanticWorld,
      ...(Object.keys(state.properties).length ? { properties: state.properties } : {}),
      visualDesign: design,
      assetSpecification: specification,
      requirement,
      bindings,
    })
    const builtRequest = buildImageGenerationRequest(specification, requirement, generationContext)
    const request = prompt?.trim() ? Object.freeze({ ...builtRequest, prompt: prompt.trim() }) : builtRequest
    const pending = createPendingImageGenerationOperation(request)
    setOperation({
      ...pending,
      operationId: retryOperationId,
      retryOfOperationId: previousOperationId,
      bindingAssetIds: bindings.map(binding => binding.id),
      bindingEntityIds: bindings.flatMap(binding => binding.entityId ? [binding.entityId] : []),
      stage: 'queued',
      status: 'queued',
    })
    scheduler.enqueue({
      jobId: retryOperationId,
      run: () => generateArtwork(specification, requirements, generationContext, imageGenerationToken, {
        operationId: retryOperationId,
        retryOfOperationId: previousOperationId,
        ...(prompt?.trim() ? { prompt } : {}),
      }),
    })
  }

  function reportAssetApplication(event: { readonly assetId: string; readonly entityId?: string; readonly status: 'applied' | 'failed'; readonly reason?: 'resolution' | 'renderer' }): void {
    const operation = Object.values(visualGenerationOperations.value).find(item =>
      item.stage === 'applying'
        && (item.assetId === event.assetId || item.bindingAssetIds?.includes(event.assetId))
        && [...activeVisualExecutions.values()].some(execution => execution.imageOperationIds.has(item.operationId)),
    ) ?? Object.values(visualGenerationOperations.value).find(item =>
      item.stage === 'applying' && (item.assetId === event.assetId || item.bindingAssetIds?.includes(event.assetId)),
    )
    if (!operation) return
    const execution = [...activeVisualExecutions.values()].find(item => item.imageOperationIds.has(operation.operationId))
    if (event.status === 'applied') {
      if (execution) {
        if (event.entityId) execution.appliedEntityIds.add(event.entityId)
        const expected = operation.bindingEntityIds ?? []
        const operationComplete = expected.length === 0 || expected.every(entityId => execution.appliedEntityIds.has(entityId))
        if (!operationComplete) {
          setOperation({ ...operation, assetResolutionStatus: 'resolved' })
          return
        }
        execution.completedImageOperationIds.add(operation.operationId)
      }
      setOperation(finishImageGenerationOperation(operation, {
        status: 'succeeded',
        stage: 'ready',
        assetResolutionStatus: 'resolved',
        rendererStatus: 'applied',
        outcome: 'generated_and_applied',
      }))
      pendingAssetReplacements.delete(operation.operationId)
      if (execution) {
        execution.plan = withAssetExecutionProgress(execution.plan, {
          stage: 'RENDERER_APPLIED',
          operationId: execution.plan.operation.operationId,
          worldId: execution.plan.operation.worldId,
          assetIds: operation.bindingAssetIds,
          entityIds: operation.bindingEntityIds,
        })
        finalizeVisualExecution(execution)
        if (execution.plan.operation.worldId === currentWorldId.value) useObservatoryDataStore().recordWorldEvolution(execution.plan)
      }
      return
    }
    const previousReplacement = operation.retryOfOperationId ? pendingAssetReplacements.get(operation.operationId) : undefined
    if (previousReplacement) {
      assetManifest.value = previousReplacement.manifest
      assetManifestRevision.value = previousReplacement.revision
      for (const assetId of operation.bindingAssetIds ?? [operation.assetId]) assetStore.invalidate(assetId)
      markWorldUpdated()
      pendingAssetReplacements.delete(operation.operationId)
    }
    setOperation(finishImageGenerationOperation(operation, {
      status: 'failed',
      stage: 'fallback',
      assetResolutionStatus: event.reason === 'resolution' ? 'failed' : 'resolved',
      rendererStatus: 'failed',
      outcome: 'generated_but_not_applied',
      fallback: 'static',
      failure: { code: event.reason === 'renderer' ? 'renderer_failed' : 'invalid_output', message: event.reason === 'renderer' ? 'Generated artwork could not be displayed' : 'Generated artwork could not be resolved' },
    }))
    if (execution) {
      execution.plan = withAssetExecutionProgress(execution.plan, {
        stage: 'VISUAL_SYNC_FAILED',
        operationId: execution.plan.operation.operationId,
        worldId: execution.plan.operation.worldId,
        assetIds: operation.bindingAssetIds,
        entityIds: operation.bindingEntityIds,
        message: event.reason === 'renderer' ? 'Generated artwork could not be displayed' : 'Generated artwork could not be resolved',
      })
      execution.result = Object.freeze({
        ...(execution.result ?? {
          operationId: execution.plan.operation.operationId,
          worldId: execution.plan.operation.worldId,
          semanticRevision: execution.plan.operation.semanticRevision ?? 0,
          visualRevision: execution.plan.operation.visualRevision ?? 0,
          status: 'failed' as const,
          generationRequiredAssetIds: Object.freeze([]),
          generatedCanonicalAssetIds: Object.freeze([]),
          reboundAssetIds: Object.freeze([]),
          removedAssetIds: Object.freeze([]),
          retainedAssetIds: Object.freeze([]),
          failedAssetIds: Object.freeze([]),
          fallbackAssetIds: Object.freeze([]),
          rendererAppliedEntityIds: Object.freeze([]),
          manifestRevision: assetManifestRevision.value,
          previousVisualRetained: true,
        }),
        status: 'failed' as const,
        previousVisualRetained: true,
        failureReason: event.reason === 'renderer' ? 'renderer_failed' : 'asset_resolution_failed',
      })
      execution.plan = withAssetExecutionResult(execution.plan, execution.result)
      if (execution.plan.operation.worldId === currentWorldId.value) useObservatoryDataStore().recordWorldEvolution(execution.plan)
      activeVisualExecutions.delete(execution.plan.operation.operationId)
    }
  }

  function finalizeVisualExecution(execution: ActiveVisualExecution): void {
    if (!execution.result) {
      return
    }
    if (execution.completedImageOperationIds.size < execution.imageOperationIds.size) return
    const result = Object.freeze({
      ...execution.result,
      status: 'completed' as const,
      rendererAppliedEntityIds: Object.freeze([...execution.appliedEntityIds]),
      previousVisualRetained: false,
    })
    if (execution.plan.operation.status !== 'visual_sync_completed') {
      execution.plan = withAssetExecutionProgress(execution.plan, {
        stage: 'VISUAL_SYNC_COMPLETED',
        operationId: execution.plan.operation.operationId,
        worldId: execution.plan.operation.worldId,
        entityIds: [...execution.appliedEntityIds],
      })
    }
    execution.plan = withAssetExecutionResult(execution.plan, result)
    if (execution.plan.operation.worldId === currentWorldId.value) useObservatoryDataStore().recordWorldEvolution(execution.plan)
    activeVisualExecutions.delete(execution.plan.operation.operationId)
  }

  async function send(input: string): Promise<CommandExecutionResult> {
    commandStatus.value = 'running'
    try {
      const routingResult = new DefaultIntentRouter().route(input)
      // A deterministic route remains the inexpensive fast path. Once a world
      // exists, however, a deterministic miss is only a routing miss: the
      // existing structured evolution planner may still interpret and validate
      // a legitimate conversational follow-up. Its candidate is never applied
      // unless the normal target-resolution, delta-validation, and revision
      // guards all succeed.
      const shouldAttemptEvolution = routingResult.route === 'world-evolution'
        || (routingResult.route === 'unknown' && semanticState.value?.semanticWorld != null)
      if (shouldAttemptEvolution) {
        const result = await planEvolution(input, evolutionPlanner)
        lastCommand.value = result
        log.value.push(result.message)
        commandStatus.value = result.success ? 'success' : 'error'
        return result
      }
      const result = useAsyncGeneration && commandExecutor.executeAsync
        ? await commandExecutor.executeAsync(input)
        : commandExecutor.execute(input)
      lastCommand.value = result
      useObservatoryDataStore().loadGenerationTrace(result.generationDiagnostics, result.gameplaySpecification, result.gameplayDiagnostics, result.gameplayRuleSet)
      log.value.push(result.message)
      commandStatus.value = result.success ? 'success' : 'error'

      if (result.success) {
        scheduler.cancel()
        imageGenerationToken++
        activeVisualExecutions.clear()
        visualGenerationOperations.value = {}
        const gameDesignSpecification = result.generationDiagnostics?.specification
        const nextVisualDesign = buildVisualDesignSpecification(gameDesignSpecification)
        const nextAssetSpecification = nextVisualDesign
          ? new DefaultAssetSpecificationBuilder().build(nextVisualDesign)
          : undefined
        visualDesignSpecification.value = nextVisualDesign ?? null
        assetSpecificationState.value = nextAssetSpecification ?? null
        assetManifest.value = buildStaticAssetManifest(gameDesignSpecification)
        assetManifestRevision.value = 0
        worldRevision.value++
        const nextWorldId = `world-${worldRevision.value}`
        semanticState.value = freezeSemanticState({
          worldId: nextWorldId,
          semanticWorld: result.semanticWorld ?? null,
          properties: gameDesignSpecification?.theme?.name
            ? { theme: gameDesignSpecification.theme.name }
            : {},
          semanticRevision: 0,
        })
        gameplaySpecificationState.value = result.gameplaySpecification ?? null
        gameplayRuleSetState.value = result.gameplayRuleSet
          ? bindGameplayRuleSet(result.gameplayRuleSet, { worldId: nextWorldId, semanticRevision: 0 })
          : null
        recordRuntimeGameplaySessionState(Object.freeze({ status: 'active' }))
        runtimeSemanticRevision.value = 0
        runtimeSyncWorldId.value = nextWorldId
        lastRuntimeSyncOperationId.value = null
        visualRevision.value = 0
        lastVisualPlanOperationId.value = null
        useObservatoryDataStore().resetEvolution(currentWorldId.value)
        useObservatoryDataStore().loadRuntimeWorld(worldStore.getWorld(), currentWorldId.value)
        markWorldUpdated()
        if (nextAssetSpecification && nextVisualDesign) {
          const token = imageGenerationToken
          for (const requirements of groupAiGenerationRequirements(nextAssetSpecification)) {
            const [requirement, bindings] = requirements
            const operationId = `image-generation-client-${requirement.id}`
            const generationContext = imageGenerationContextBuilder.build({
              metadata: {
                worldId: nextWorldId,
                operationId,
                semanticRevision: 0,
                runtimeSemanticRevision: 0,
                visualRevision: 0,
                architectureVersion: PROJECT_METADATA.architectureVersion,
              },
              ...(result.semanticWorld ? { semanticWorld: result.semanticWorld } : {}),
              ...(gameDesignSpecification?.theme?.name ? { properties: { theme: gameDesignSpecification.theme.name } } : {}),
              visualDesign: nextVisualDesign,
              assetSpecification: nextAssetSpecification,
              requirement,
              bindings,
            })
            const request = buildImageGenerationRequest(nextAssetSpecification, requirement, generationContext)
            const pending = createPendingImageGenerationOperation(request)
            setOperation({
              ...pending,
              bindingAssetIds: bindings.map(binding => binding.id),
              bindingEntityIds: bindings.flatMap(binding => binding.entityId ? [binding.entityId] : []),
              stage: 'queued',
              status: 'queued',
            })
            scheduler.enqueue({
              jobId: pending.operationId,
              run: () => generateArtwork(nextAssetSpecification, requirements, generationContext, token),
            })
          }
        }
      }
      return result
    } catch (error) {
      const result: CommandExecutionResult = {
        success: false,
        message: error instanceof Error ? error.message : 'Command failed',
      }
      lastCommand.value = result
      log.value.push(result.message)
      commandStatus.value = 'error'
      return result
    }
  }

  async function planEvolution(input: string, planner: WorldEvolutionPlanner | undefined): Promise<import('../command').CommandExecutionResult> {
    const stateAtRequest = semanticState.value
    if (!planner || !stateAtRequest?.semanticWorld || !stateAtRequest.worldId) {
      return { success: false, message: 'Cannot evolve: no current semantic world is available' }
    }
    const request: WorldEvolutionRequest = Object.freeze({
      operationId: `evolution-${++evolutionOperationSequence}`,
      instruction: input,
      createdAt: new Date().toISOString(),
      context: Object.freeze({
        worldId: stateAtRequest.worldId,
        semanticWorld: stateAtRequest.semanticWorld,
        properties: stateAtRequest.properties,
        semanticRevision: stateAtRequest.semanticRevision,
        runtimeSemanticRevision: runtimeSemanticRevision.value,
        visualRevision: visualRevision.value,
        ...(selectedEntityId.value ? { selectedEntityId: selectedEntityId.value } : {}),
      }),
    })
    const plan: WorldEvolutionPlanResult = await planner.plan(request)
    if (plan.status !== 'validated') {
      if (plan.operation.worldId === currentWorldId.value) useObservatoryDataStore().recordWorldEvolution(plan)
      return {
        success: false,
        message: `World evolution ${plan.status}: ${plan.reason}`,
        evolutionPlan: plan,
      }
    }

    const currentState = semanticState.value
    const mutation = currentState?.semanticWorld
      ? semanticWorldDeltaApplier.apply(currentState.semanticWorld, plan.delta, {
        worldId: currentState.worldId,
        semanticRevision: currentState.semanticRevision,
        properties: currentState.properties,
      })
      : undefined
    if (!mutation) {
      return { success: false, message: 'World evolution semantic application failed: no current semantic world' }
    }
    if (!visualDesignSpecification.value || !assetSpecificationState.value) {
      return { success: false, message: 'World evolution visual planning failed: current visual specifications are unavailable' }
    }

    let appliedPlan = withSemanticApplication(plan, mutation)
    if (mutation.status === 'applied' && gameplayRuleSetState.value && gameplaySpecificationState.value) {
      const reconciliation = gameplayRuleReconciler.reconcile({
        semanticWorld: mutation.updatedWorld,
        gameplaySpecification: gameplaySpecificationState.value,
        currentRuleSet: gameplayRuleSetState.value,
        semanticMutation: mutation,
      })
      if (reconciliation.status === 'failed' || !reconciliation.ruleSet) {
        const failedPlan = withGameplayReconciliation(plan, reconciliation)
        if (failedPlan.operation.worldId === currentWorldId.value) useObservatoryDataStore().recordWorldEvolution(failedPlan)
        return {
          success: false,
          message: `World evolution gameplay rule reconciliation failed: ${reconciliation.failureReason ?? 'unknown error'}`,
          evolutionPlan: failedPlan,
        }
      }
      appliedPlan = withGameplayReconciliation(appliedPlan, reconciliation)
      semanticState.value = freezeSemanticState({
        worldId: currentState!.worldId,
        semanticWorld: mutation.updatedWorld,
        properties: mutation.updatedProperties,
        semanticRevision: mutation.updatedRevision,
      })
      gameplayRuleSetState.value = reconciliation.ruleSet
    } else if (mutation.status === 'applied') {
      semanticState.value = freezeSemanticState({
        worldId: currentState!.worldId,
        semanticWorld: mutation.updatedWorld,
        properties: mutation.updatedProperties,
        semanticRevision: mutation.updatedRevision,
      })
    }
    if (mutation.status === 'applied') {
      const runtimeSync = runtimeWorldEvolutionSynchronizer.synchronize(worldStore.getWorld(), mutation, {
        worldId: runtimeSyncWorldId.value || currentState!.worldId,
        runtimeRevision: runtimeSemanticRevision.value,
        ...(lastRuntimeSyncOperationId.value ? { lastAppliedOperationId: lastRuntimeSyncOperationId.value } : {}),
      })
      const synchronizedPlan = withRuntimeSynchronization(appliedPlan, runtimeSync)
      if (runtimeSync.status === 'synchronized') {
        worldStore.setWorld(runtimeSync.updatedWorld)
        markWorldUpdated()
      }
      if (runtimeSync.status !== 'failed') {
        runtimeSemanticRevision.value = runtimeSync.updatedRevision
        runtimeSyncWorldId.value = currentState!.worldId
        lastRuntimeSyncOperationId.value = mutation.operationId
        useObservatoryDataStore().loadRuntimeWorld(worldStore.getWorld(), currentState!.worldId)
      }
      if (runtimeSync.status !== 'failed') {
        const visualPlan = visualEvolutionPlanner.plan(
          mutation.previousWorld,
          mutation.updatedWorld,
          mutation,
          runtimeSync,
          visualDesignSpecification.value,
          assetSpecificationState.value,
          {
            worldId: currentState!.worldId,
            semanticRevision: currentState!.semanticRevision,
            runtimeRevision: runtimeSync.previousRevision,
            visualRevision: visualRevision.value,
            ...(lastVisualPlanOperationId.value ? { lastPlannedOperationId: lastVisualPlanOperationId.value } : {}),
          },
        )
        const plannedEvolution = withVisualPlanning(synchronizedPlan, visualPlan)
        if (visualPlan.status !== 'failed' && visualPlan.status !== 'already_planned') {
          visualDesignSpecification.value = visualPlan.updatedVisualDesign
          assetSpecificationState.value = visualPlan.updatedAssetSpecification
          visualRevision.value = visualPlan.updatedVisualRevision
          lastVisualPlanOperationId.value = mutation.operationId
        }
        const runtimeMessage = runtimeSync.runtimeImpact === 'none'
          ? 'Runtime no runtime impact'
          : 'Runtime synchronized'
        if (visualPlan.status === 'failed') {
          return {
            success: false,
            message: `Semantic world updated; ${runtimeMessage}, but visual planning failed: ${visualPlan.failureReason ?? 'unknown error'}`,
            evolutionPlan: plannedEvolution,
          }
        }
        if (visualPlan.status !== 'already_planned') {
          scheduler.cancel()
          imageGenerationToken++
          cancelSupersededVisualOperations()
          activeVisualExecutions.clear()
          const execution: ActiveVisualExecution = {
            plan: plannedEvolution,
            imageOperationIds: new Set(),
            appliedEntityIds: new Set(),
            completedImageOperationIds: new Set(),
          }
          activeVisualExecutions.set(plannedEvolution.operation.operationId, execution)
          const executionContext = {
            worldId: currentState!.worldId,
            semanticRevision: visualPlan.semanticRevision,
            runtimeSemanticRevision: runtimeSync.updatedRevision,
            visualRevision: visualPlan.updatedVisualRevision,
            manifestRevision: assetManifestRevision.value,
            token: imageGenerationToken,
            semanticWorld: mutation.updatedWorld,
            properties: mutation.updatedProperties,
            architectureVersion: PROJECT_METADATA.architectureVersion,
          }
          const executionPromise = visualAssetEvolutionExecutor.execute(visualPlan, assetManifest.value, executionContext)
          void executionPromise.then(result => {
            const currentExecution = activeVisualExecutions.get(plannedEvolution.operation.operationId)
            if (!currentExecution) return
            currentExecution.result = result
            currentExecution.plan = withAssetExecutionResult(currentExecution.plan, result)
            if (result.status === 'failed' || result.status === 'stale') {
              if (currentExecution.plan.operation.worldId === currentWorldId.value) useObservatoryDataStore().recordWorldEvolution(currentExecution.plan)
              activeVisualExecutions.delete(plannedEvolution.operation.operationId)
              return
            }
            finalizeVisualExecution(currentExecution)
            if (currentExecution.plan.operation.worldId === currentWorldId.value) useObservatoryDataStore().recordWorldEvolution(currentExecution.plan)
          })
          if (plannedEvolution.operation.worldId === currentWorldId.value) useObservatoryDataStore().recordWorldEvolution(execution.plan)
          const visualMessage = visualPlan.generationRequired.length > 0
            ? `Visual asset execution started; ${visualPlan.generationRequired.length} canonical request(s)`
            : 'Visual asset synchronization completed'
          return {
            success: true,
            message: `Semantic world updated: ${plan.delta.summary} (${runtimeMessage}; ${visualMessage})`,
            evolutionPlan: execution.plan,
          }
        }
        if (plannedEvolution.operation.worldId === currentWorldId.value) useObservatoryDataStore().recordWorldEvolution(plannedEvolution)
        const visualMessage = visualPlan.generationRequired.length > 0
          ? `Visual delta planned; ${visualPlan.generationRequired.length} canonical asset execution(s) pending`
          : 'Visual delta planned; no asset generation required'
        return {
          success: true,
          message: `Semantic world updated: ${plan.delta.summary} (${runtimeMessage}; ${visualMessage})`,
          evolutionPlan: plannedEvolution,
        }
      }
      if (synchronizedPlan.operation.worldId === currentWorldId.value) useObservatoryDataStore().recordWorldEvolution(synchronizedPlan)
      return {
        success: false,
        message: `Semantic world updated, but Runtime synchronization failed: ${runtimeSync.failureReason ?? 'unknown error'}`,
        evolutionPlan: synchronizedPlan,
      }
    }
    if (appliedPlan.operation.worldId === currentWorldId.value) useObservatoryDataStore().recordWorldEvolution(appliedPlan)
    return {
      success: false,
      message: `World evolution semantic application failed: ${mutation.failureReason ?? 'unknown error'}`,
      evolutionPlan: appliedPlan,
    }
  }

  return {
    runtime,
    worldStore,
    gameplayEventCollector,
    assetStore,
    assetManifest,
    assetManifestRevision,
    renderVersion,
    worldRevision,
    currentWorldId,
    semanticWorld,
    semanticProperties,
    semanticRevision,
    gameplaySpecification: gameplaySpecificationState,
    gameplaySessionState,
    recordRuntimeGameplaySessionState,
    gameplayRevision: computed(() => gameplaySpecificationState.value?.gameplayRevision ?? 0),
    gameplayRuleSet: gameplayRuleSetState,
    visualDesignSpecification,
    assetSpecification: assetSpecificationState,
    visualRevision,
    runtimeSemanticRevision,
    runtimeSyncWorldId,
    selectedEntityId,
    selectedEntity,
    selectEntity,
    markWorldUpdated,
    log,
    commandStatus,
    lastCommand,
    imageGenerationOperation,
    visualGenerationOperations,
    reportAssetApplication,
    regenerateArtwork,
    send,
    // Streaming state (inert — preserved for UI backward compatibility)
    isStreaming,
    streamingText,
    streamingFinished,
    useStreaming,
  }
})
