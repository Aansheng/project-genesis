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
import { Runtime, DefaultRuntimeWorldStore } from '@genesis/runtime'
import type { RuntimeWorldStore } from '@genesis/runtime'
import { DefaultAssetResolver, DefaultAssetStore } from '@genesis/assets'
import type { AssetManifest, ImageGenerationOperation, AssetSpecification, GameDesignSpecification } from '@genesis/shared'
import { DefaultIntentRouter, DefaultGameIntentExtractor, DefaultCreateWorldPipeline, DefaultCreateWorldRuntimeExecutor, DefaultSemanticWorldGenerator, DefaultSemanticGameDslBuilder, DefaultVisualDesignSpecificationBuilder, DefaultAssetSpecificationBuilder, createAIConfiguration, DeterministicGameWorldGenerationProvider, DefaultGameWorldValidator, GameWorldGenerationProviderAdapter, LLMGameWorldGenerationCandidateProvider, FallbackGameWorldGenerationProvider } from '@genesis/ai'
import type { GameWorldGenerationProvider } from '@genesis/ai'
import { DefaultRuntimeProjection } from '@genesis/runtime'
import { DefaultAssetManifestBuilder } from '@genesis/shared'
import { DefaultCommandExecutor } from '../command'
import type { CommandExecutor } from '../command'
import { BrowserStructuredGenerationClient } from '../ai/BrowserStructuredGenerationClient'
import { BrowserImageGenerationClient } from '../ai/BrowserImageGenerationClient'
import { buildImageGenerationRequest, groupAiGenerationRequirements } from '../assets/AssetGenerationPolicy'
import { buildGeneratedAssetManifest, createPendingImageGenerationOperation, finishImageGenerationOperation } from '../assets/GeneratedAssetOrchestrator'
import { VisualAssetGenerationScheduler } from '../assets/VisualAssetGenerationScheduler'
import { useObservatoryDataStore } from './observatoryData'
import { createStaticAssetResolutions } from '../assets/StaticAssetCatalog'

export type CommandStatus = 'idle' | 'running' | 'success' | 'error'

const EMPTY_ASSET_MANIFEST: AssetManifest = Object.freeze({ entries: Object.freeze([]) })

function buildAssetSpecification(
  specification: GameDesignSpecification | undefined,
): AssetSpecification | undefined {
  if (!specification) return undefined
  const visual = new DefaultVisualDesignSpecificationBuilder().build(specification)
  return new DefaultAssetSpecificationBuilder().build(visual)
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

function imageGatewayURL(gatewayURL: string): string {
  return gatewayURL.replace(/\/api\/world-generation\/?$/u, '/api/image-generation')
}

export function createCommandExecutor(
  worldStore: RuntimeWorldStore,
  env: Record<string, string | undefined> = import.meta.env,
  fetcher: typeof fetch = globalThis.fetch.bind(globalThis),
): { executor: CommandExecutor; useAsync: boolean } {
  const configuration = createAIConfiguration(env)
  const deterministicProvider = new DeterministicGameWorldGenerationProvider()
  let generationProvider: GameWorldGenerationProvider = deterministicProvider
  let useAsync = false

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
  )
  const createWorldExecutor = new DefaultCreateWorldRuntimeExecutor(pipeline, worldStore)
  return { executor: new DefaultCommandExecutor(new DefaultIntentRouter(), createWorldExecutor), useAsync }
}

export const useGameStore = defineStore('game', () => {
  const runtime = new Runtime()
  const worldStore: RuntimeWorldStore = new DefaultRuntimeWorldStore(runtime.world)
  const assetStore = new DefaultAssetStore(new DefaultAssetResolver())
  const assetManifest = ref<AssetManifest>(EMPTY_ASSET_MANIFEST)
  const renderVersion = ref(0)
  const selectedEntityId = ref<string | null>(null)
  const log = ref<string[]>([])
  const commandStatus = ref<CommandStatus>('idle')
  const lastCommand = ref<import('../command').CommandExecutionResult | null>(null)
  const visualGenerationOperations = ref<Record<string, ImageGenerationOperation>>({})
  const imageGenerationOperation = computed<ImageGenerationOperation | null>(() => {
    const operations = Object.values(visualGenerationOperations.value)
    return operations.find(operation => operation.stage === 'generating' || operation.stage === 'applying')
      ?? operations.at(-1)
      ?? null
  })
  let imageGenerationToken = 0
  const scheduler = new VisualAssetGenerationScheduler<unknown>(1, (jobId, status) => {
    const operation = visualGenerationOperations.value[jobId]
    if (!operation || status === 'completed' || status === 'cancelled') return
    setOperation({ ...operation, status: status === 'queued' ? 'queued' : 'running', stage: status === 'queued' ? 'queued' : 'generating' })
  })

  function setOperation(operation: ImageGenerationOperation): void {
    visualGenerationOperations.value = { ...visualGenerationOperations.value, [operation.operationId]: operation }
  }

  // --- Streaming UI state (inert — preserved for UI backward compatibility) ---
  const isStreaming = ref(false)
  const streamingText = ref('')
  const streamingFinished = ref(false)
  const useStreaming = ref(false)

  const { executor: commandExecutor, useAsync: useAsyncGeneration } = createCommandExecutor(worldStore)
  const imageClient = new BrowserImageGenerationClient(imageGatewayURL(
    createAIConfiguration(import.meta.env).gatewayURL || DEFAULT_AI_GATEWAY_URL,
  ))

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

  async function generateArtwork(specification: AssetSpecification, requirements: readonly [import('@genesis/shared').AssetRequirement, readonly import('@genesis/shared').AssetRequirement[]], token: number): Promise<void> {
    const [requirement, bindings] = requirements
    const request = buildImageGenerationRequest(specification, requirement)
    const pending = createPendingImageGenerationOperation(request)
    setOperation({ ...pending, bindingAssetIds: bindings.map(binding => binding.id), stage: 'queued', status: 'queued' })
    try {
      const result = await imageClient.generate(request)
      if (token !== imageGenerationToken) return
      if (result.status !== 'success') {
        const providerOperation = result.operation ?? pending
        setOperation(finishImageGenerationOperation({
          ...pending,
          ...providerOperation,
          operationId: pending.operationId,
          entityId: request.entityId,
          assetKind: request.constraints?.assetKind,
          input: pending.input,
          bindingAssetIds: bindings.map(binding => binding.id),
        }, {
          status: 'failed',
          stage: 'fallback',
          artifactStatus: 'failed',
          outcome: 'generation_failed_fallback',
          fallback: 'static',
          failure: result.failure,
        }))
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
      })
      assetStore.invalidate(result.assetId)
      for (const binding of bindings) assetStore.invalidate(binding.id)
      assetManifest.value = buildGeneratedAssetManifest(specification, assetManifest.value, result, bindings.map(binding => binding.id))
      markWorldUpdated()
    } catch (error) {
      if (token !== imageGenerationToken) return
      setOperation(finishImageGenerationOperation(pending, {
        status: 'failed',
        stage: 'fallback',
        artifactStatus: 'failed',
        outcome: 'generation_failed_fallback',
        fallback: 'static',
        failure: { code: 'provider_unavailable', message: error instanceof Error ? error.message : 'Image generation unavailable' },
      }))
    }
  }

  function reportAssetApplication(event: { readonly assetId: string; readonly entityId?: string; readonly status: 'applied' | 'failed'; readonly reason?: 'resolution' | 'renderer' }): void {
    const operation = Object.values(visualGenerationOperations.value).find(item =>
      item.stage === 'applying' && (item.assetId === event.assetId || item.bindingAssetIds?.includes(event.assetId)),
    )
    if (!operation) return
    if (event.status === 'applied') {
      setOperation(finishImageGenerationOperation(operation, {
        status: 'succeeded',
        stage: 'ready',
        assetResolutionStatus: 'resolved',
        rendererStatus: 'applied',
        outcome: 'generated_and_applied',
      }))
      return
    }
    setOperation(finishImageGenerationOperation(operation, {
      status: 'failed',
      stage: 'fallback',
      assetResolutionStatus: event.reason === 'resolution' ? 'failed' : 'resolved',
      rendererStatus: 'failed',
      outcome: 'generated_but_not_applied',
      fallback: 'static',
      failure: { code: 'invalid_output', message: event.reason === 'renderer' ? 'Generated artwork could not be displayed' : 'Generated artwork could not be resolved' },
    }))
  }

  async function send(input: string) {
    commandStatus.value = 'running'
    try {
      const result = useAsyncGeneration && commandExecutor.executeAsync
        ? await commandExecutor.executeAsync(input)
        : commandExecutor.execute(input)
      lastCommand.value = result
      useObservatoryDataStore().loadGenerationTrace(result.generationDiagnostics)
      log.value.push(result.message)
      commandStatus.value = result.success ? 'success' : 'error'

      if (result.success) {
        scheduler.cancel()
        imageGenerationToken++
        visualGenerationOperations.value = {}
        const gameDesignSpecification = result.generationDiagnostics?.specification
        const assetSpecification = buildAssetSpecification(gameDesignSpecification)
        assetManifest.value = buildStaticAssetManifest(gameDesignSpecification)
        markWorldUpdated()
        if (assetSpecification) {
          const token = imageGenerationToken
          for (const requirements of groupAiGenerationRequirements(assetSpecification)) {
            scheduler.enqueue({
              jobId: createPendingImageGenerationOperation(buildImageGenerationRequest(assetSpecification, requirements[0])).operationId,
              run: () => generateArtwork(assetSpecification, requirements, token),
            })
          }
        }
      }
      return result
    } catch (error) {
      const result = {
        success: false,
        message: error instanceof Error ? error.message : 'Command failed',
      }
      lastCommand.value = result
      log.value.push(result.message)
      commandStatus.value = 'error'
      return result
    }
  }

  return {
    runtime,
    worldStore,
    assetStore,
    assetManifest,
    renderVersion,
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
    send,
    // Streaming state (inert — preserved for UI backward compatibility)
    isStreaming,
    streamingText,
    streamingFinished,
    useStreaming,
  }
})
