import type {
  AssetManifest,
  AssetManifestEntry,
  AssetRequirement,
  AssetResourceMetadata,
  AssetResourceReference,
  AssetSpecification,
  GameWorldModel,
  ImageGenerationFailureCode,
  ImageGenerationOperation,
  VisualAssetExecutionResult,
  VisualAssetExecutionStatus,
  VisualEvolutionPlan,
  WorldSemanticProperties,
} from '@genesis/shared'
import { DefaultImageGenerationContextBuilder } from '@genesis/shared'
import type { AssetStore } from '@genesis/assets'
import type { BrowserImageGenerationClient } from '../ai/BrowserImageGenerationClient'
import { buildImageGenerationRequest, groupAiGenerationRequirements } from './AssetGenerationPolicy'
import { createPendingImageGenerationOperation, finishImageGenerationOperation } from './GeneratedAssetOrchestrator'
import { VisualAssetGenerationScheduler } from './VisualAssetGenerationScheduler'

export type VisualAssetExecutionStage =
  | 'ASSET_EXECUTION_STARTED'
  | 'ASSET_GENERATION_STARTED'
  | 'ASSET_GENERATED'
  | 'MANIFEST_REBOUND'
  | 'ASSET_RESOLVED'
  | 'RENDERER_APPLIED'
  | 'VISUAL_SYNC_COMPLETED'
  | 'VISUAL_SYNC_FAILED'

export interface VisualAssetExecutionProgress {
  readonly stage: VisualAssetExecutionStage
  readonly operationId: string
  readonly worldId: string
  readonly canonicalAssetId?: string
  readonly assetIds?: readonly string[]
  readonly entityIds?: readonly string[]
  readonly message?: string
}

export interface VisualAssetEvolutionExecutionContext {
  readonly worldId: string
  readonly semanticRevision: number
  readonly runtimeSemanticRevision?: number
  readonly visualRevision: number
  readonly manifestRevision: number
  readonly token: number
  readonly semanticWorld?: GameWorldModel
  readonly properties?: WorldSemanticProperties
  readonly architectureVersion?: string
}

export interface VisualAssetEvolutionExecutorOptions {
  readonly imageClient: Pick<BrowserImageGenerationClient, 'generate'>
  readonly scheduler: VisualAssetGenerationScheduler<unknown>
  readonly assetStore: AssetStore
  readonly isCurrent?: (context: VisualAssetEvolutionExecutionContext) => boolean
  readonly onOperation?: (operation: ImageGenerationOperation) => void
  readonly onProgress?: (progress: VisualAssetExecutionProgress) => void
  readonly onManifestCommitted?: (change: {
    readonly operationId: string
    readonly manifest: AssetManifest
    readonly manifestRevision: number
    readonly affectedAssetIds: readonly string[]
  }) => void
}

export interface TargetedGeneratedAsset {
  readonly resource: AssetResourceReference
  readonly metadata?: AssetResourceMetadata
}

function freeze<T extends object>(value: T): Readonly<T> {
  return Object.freeze(value)
}

function freezeArray<T>(items: readonly T[]): readonly T[] {
  return Object.freeze([...items])
}

function unique(items: readonly string[]): readonly string[] {
  return freezeArray([...new Set(items)])
}

function unresolvedEntry(requirement: AssetRequirement): AssetManifestEntry {
  return freeze({
    assetId: requirement.id,
    kind: requirement.kind,
    target: requirement.target,
    ...(requirement.entityId ? { entityId: requirement.entityId } : {}),
    ...(requirement.renderUsage ? { renderUsage: requirement.renderUsage } : {}),
    ...(requirement.presentationState ? { presentationState: requirement.presentationState } : {}),
    ...(requirement.presentationFrame !== undefined ? { presentationFrame: requirement.presentationFrame } : {}),
    status: 'unresolved' as const,
  })
}

function generatedEntry(requirement: AssetRequirement, asset: TargetedGeneratedAsset): AssetManifestEntry {
  if (!asset.resource.uri.trim()) throw new Error(`Generated asset "${requirement.id}" has no resource URI`)
  return freeze({
    assetId: requirement.id,
    kind: requirement.kind,
    target: requirement.target,
    ...(requirement.entityId ? { entityId: requirement.entityId } : {}),
    ...(requirement.renderUsage ? { renderUsage: requirement.renderUsage } : {}),
    ...(requirement.presentationState ? { presentationState: requirement.presentationState } : {}),
    ...(requirement.presentationFrame !== undefined ? { presentationFrame: requirement.presentationFrame } : {}),
    status: 'resolved' as const,
    origin: 'generated' as const,
    resource: freeze({ uri: asset.resource.uri }),
    ...(asset.metadata ? { metadata: freeze({ ...asset.metadata }) } : {}),
  })
}

/**
 * Apply only generated bindings to the current manifest.
 * Existing entry objects are kept by identity when they are unaffected.
 */
export function buildTargetedAssetManifest(
  specification: AssetSpecification,
  currentManifest: AssetManifest,
  generated: ReadonlyMap<string, TargetedGeneratedAsset> = new Map(),
): AssetManifest {
  const requirementIds = new Set(specification.assets.map(requirement => requirement.id))
  for (const assetId of generated.keys()) {
    if (!requirementIds.has(assetId)) throw new Error(`Generated asset "${assetId}" is not in the updated specification`)
  }

  const currentById = new Map(currentManifest.entries.map(entry => [entry.assetId, entry]))
  const entries = specification.assets.map(requirement => {
    const generatedAsset = generated.get(requirement.id)
    if (generatedAsset) return generatedEntry(requirement, generatedAsset)
    return currentById.get(requirement.id) ?? unresolvedEntry(requirement)
  })
  if (entries.length === currentManifest.entries.length && entries.every((entry, index) => entry === currentManifest.entries[index])) {
    return currentManifest
  }
  return freeze({ entries: freezeArray(entries) })
}

export const buildTargetedGeneratedAssetManifest = buildTargetedAssetManifest

function bindingsFor(specification: AssetSpecification, canonical: AssetRequirement): readonly AssetRequirement[] {
  return groupAiGenerationRequirements(specification).find(([candidate]) => candidate.id === canonical.id)?.[1] ?? [canonical]
}

function resultBase(
  plan: VisualEvolutionPlan,
  context: VisualAssetEvolutionExecutionContext,
  status: VisualAssetExecutionStatus,
  manifestRevision: number,
  patch: Partial<VisualAssetExecutionResult> = {},
): VisualAssetExecutionResult {
  return freeze({
    operationId: plan.operationId,
    worldId: context.worldId,
    semanticRevision: context.semanticRevision,
    visualRevision: context.visualRevision,
    status,
    generationRequiredAssetIds: freezeArray(plan.generationRequired.map(requirement => requirement.id)),
    generatedCanonicalAssetIds: freezeArray([]),
    reboundAssetIds: freezeArray([]),
    removedAssetIds: freezeArray([]),
    retainedAssetIds: freezeArray([]),
    failedAssetIds: freezeArray([]),
    fallbackAssetIds: freezeArray([]),
    rendererAppliedEntityIds: freezeArray([]),
    manifestRevision,
    previousVisualRetained: false,
    ...patch,
  })
}

function failureCode(reason: string): ImageGenerationFailureCode {
  if (reason === 'stale_operation') return 'stale_operation'
  if (reason === 'manifest_commit_failed') return 'manifest_commit_failed'
  return 'invalid_output'
}

/** Executes the planner-owned canonical generation set without rebuilding the world. */
export class VisualAssetEvolutionExecutor {
  private readonly completed = new Map<string, VisualAssetExecutionResult>()
  private readonly running = new Map<string, Promise<VisualAssetExecutionResult>>()
  private readonly cancelHandlers = new Map<string, () => void>()

  constructor(private readonly options: VisualAssetEvolutionExecutorOptions) {}

  /** Lets the existing scheduler cancel queued evolution jobs without knowing this executor's state. */
  cancelJob(jobId: string): void {
    this.cancelHandlers.get(jobId)?.()
  }

  execute(
    plan: VisualEvolutionPlan,
    currentManifest: AssetManifest,
    context: VisualAssetEvolutionExecutionContext,
  ): Promise<VisualAssetExecutionResult> {
    const previous = this.completed.get(plan.operationId)
    if (previous) return Promise.resolve(previous)
    const active = this.running.get(plan.operationId)
    if (active) return active

    if (plan.status === 'already_planned') {
      const result = resultBase(plan, context, 'already_synced', context.manifestRevision, {
        retainedAssetIds: freezeArray(currentManifest.entries.map(entry => entry.assetId)),
      })
      this.completed.set(plan.operationId, result)
      return Promise.resolve(result)
    }

    if (!this.isCurrent(context)) {
      const result = resultBase(plan, context, 'stale', context.manifestRevision, {
        previousVisualRetained: true,
        failureReason: 'stale_operation',
      })
      this.completed.set(plan.operationId, result)
      return Promise.resolve(result)
    }

    this.emit({ stage: 'ASSET_EXECUTION_STARTED', operationId: plan.operationId, worldId: context.worldId })

    if (plan.generationRequired.length === 0) {
      const result = this.executeManifestOnly(plan, currentManifest, context)
      this.completed.set(plan.operationId, result)
      return Promise.resolve(result)
    }

    let resolveExecution!: (result: VisualAssetExecutionResult) => void
    const execution = new Promise<VisualAssetExecutionResult>(resolve => { resolveExecution = resolve })
    this.running.set(plan.operationId, execution)
    let manifest = currentManifest
    let manifestRevision = context.manifestRevision
    let remaining = plan.generationRequired.length
    const generatedCanonicalAssetIds: string[] = []
    const reboundAssetIds: string[] = []
    const removedAssetIds: string[] = []
    const failedAssetIds: string[] = []
    const fallbackAssetIds: string[] = []
    let stale = false

    const settle = (): void => {
      remaining -= 1
      if (remaining > 0) return
      const finalStatus: VisualAssetExecutionStatus = stale ? 'stale' : failedAssetIds.length > 0 ? 'failed' : 'manifest_rebound'
      const result = resultBase(plan, context, finalStatus, manifestRevision, {
        generatedCanonicalAssetIds: freezeArray(generatedCanonicalAssetIds),
        reboundAssetIds: freezeArray(reboundAssetIds),
        removedAssetIds: freezeArray(removedAssetIds),
        retainedAssetIds: freezeArray(manifest.entries.map(entry => entry.assetId).filter(id => !reboundAssetIds.includes(id))),
        failedAssetIds: freezeArray(failedAssetIds),
        fallbackAssetIds: freezeArray(fallbackAssetIds),
        previousVisualRetained: stale || failedAssetIds.length > 0,
        ...(stale ? { failureReason: 'stale_operation' } : failedAssetIds.length > 0 ? { failureReason: 'generation_failed_fallback' } : {}),
      })
      this.running.delete(plan.operationId)
      this.completed.set(plan.operationId, result)
      if (finalStatus === 'failed' || finalStatus === 'stale') {
        this.emit({
          stage: 'VISUAL_SYNC_FAILED',
          operationId: plan.operationId,
          worldId: context.worldId,
          message: result.failureReason,
        })
      }
      resolveExecution(result)
    }

    for (const canonical of plan.generationRequired) {
      const bindings = bindingsFor(plan.updatedAssetSpecification, canonical)
      const bindingAssetIds = bindings.map(binding => binding.id)
      const bindingEntityIds = bindings.flatMap(binding => binding.entityId ? [binding.entityId] : [])
      const visualDesign = plan.updatedVisualDesign
      const visualContext = plan.updatedAssetSpecification.visualContext
      const generationContext = new DefaultImageGenerationContextBuilder().build({
        metadata: {
          worldId: context.worldId,
          operationId: plan.operationId,
          semanticRevision: context.semanticRevision,
          ...(context.runtimeSemanticRevision !== undefined ? { runtimeSemanticRevision: context.runtimeSemanticRevision } : {}),
          visualRevision: context.visualRevision,
          ...(context.architectureVersion ? { architectureVersion: context.architectureVersion } : {}),
        },
        ...(context.semanticWorld ? { semanticWorld: context.semanticWorld } : {}),
        ...(context.properties ? { properties: context.properties } : {}),
        visualDesign: {
          artDirection: visualDesign.artDirection ?? visualContext.artDirection,
          ...(visualDesign.worldSpatialMode ?? visualContext.worldSpatialMode
            ? { worldSpatialMode: visualDesign.worldSpatialMode ?? visualContext.worldSpatialMode }
            : {}),
          theme: visualDesign.theme ?? visualContext.theme,
          palette: visualDesign.palette ?? visualContext.palette,
          ...(visualDesign.environment ? { environment: visualDesign.environment } : {}),
        },
        assetSpecification: plan.updatedAssetSpecification,
        requirement: canonical,
        bindings,
      })
      const request = buildImageGenerationRequest(plan.updatedAssetSpecification, canonical, generationContext)
      const jobId = `image-generation-client-${plan.operationId}-${canonical.id}`
      const pending = {
        ...createPendingImageGenerationOperation(request),
        operationId: jobId,
        status: 'queued' as const,
        stage: 'queued' as const,
        bindingAssetIds,
        bindingEntityIds,
      }
      let settled = false
      const settleJob = (): void => {
        if (settled) return
        settled = true
        this.cancelHandlers.delete(jobId)
        settle()
      }
      this.cancelHandlers.set(jobId, () => {
        stale = true
        this.options.onOperation?.(finishImageGenerationOperation(pending, {
          status: 'cancelled',
          stage: 'cancelled',
          outcome: 'generation_failed_fallback',
          fallback: 'static',
          failure: { code: 'stale_operation', message: 'Visual asset execution superseded by a newer request' },
        }))
        settleJob()
      })
      this.options.onOperation?.(pending)
      this.options.scheduler.enqueue({
        jobId,
        run: async () => {
          if (!this.isCurrent(context)) {
            stale = true
            this.options.onOperation?.(finishImageGenerationOperation(pending, {
              status: 'cancelled',
              stage: 'cancelled',
              outcome: 'generation_failed_fallback',
              fallback: 'static',
              failure: { code: 'stale_operation', message: 'Visual asset execution superseded by a newer world revision' },
            }))
            settleJob()
            return
          }

          this.emit({ stage: 'ASSET_GENERATION_STARTED', operationId: plan.operationId, worldId: context.worldId, canonicalAssetId: canonical.id, assetIds: bindingAssetIds, entityIds: bindingEntityIds })
          let operation: ImageGenerationOperation = {
            ...pending,
            status: 'running',
            stage: 'generating',
          }
          this.options.onOperation?.(operation)
          const previousManifest = manifest
          let invalidatedAssetIds: readonly string[] = []
          try {
            const generation = await this.options.imageClient.generate(request)
            if (!this.isCurrent(context)) {
              stale = true
              this.options.onOperation?.(finishImageGenerationOperation(operation, {
                status: 'cancelled',
                stage: 'cancelled',
                outcome: 'generation_failed_fallback',
                fallback: 'static',
                failure: { code: 'stale_operation', message: 'Visual asset generation result was superseded' },
              }))
              settleJob()
              return
            }
            if (generation.status !== 'success') {
              failedAssetIds.push(canonical.id)
              fallbackAssetIds.push(...bindingAssetIds)
              this.options.onOperation?.(finishImageGenerationOperation({ ...operation, ...(generation.operation ?? {}), operationId: jobId, bindingAssetIds, bindingEntityIds }, {
                status: 'failed',
                stage: 'fallback',
                artifactStatus: 'failed',
                outcome: 'generation_failed_fallback',
                fallback: 'static',
                failure: generation.failure,
              }))
              settleJob()
              return
            }
            if (generation.assetId !== canonical.id || !generation.asset.resource.uri.trim()) {
              throw new Error('Generated artifact did not match the canonical request')
            }

            const generated = new Map<string, TargetedGeneratedAsset>(bindingAssetIds.map(assetId => [assetId, {
              resource: generation.asset.resource,
              metadata: generation.asset.metadata,
            }]))
            const nextManifest = buildTargetedAssetManifest(plan.updatedAssetSpecification, manifest, generated)
            const nextIds = new Set(nextManifest.entries.map(entry => entry.assetId))
            const removedFromManifest = manifest.entries.filter(entry => !nextIds.has(entry.assetId)).map(entry => entry.assetId)
            invalidatedAssetIds = unique([...bindingAssetIds, ...removedFromManifest])
            for (const assetId of invalidatedAssetIds) this.options.assetStore.invalidate(assetId)
            const resolved = await Promise.all(bindingAssetIds.map(assetId => this.options.assetStore.resolve(assetId, nextManifest)))
            if (resolved.some(item => item.status !== 'resolved')) {
              for (const assetId of invalidatedAssetIds) this.options.assetStore.invalidate(assetId)
              throw new Error('Generated asset could not be resolved')
            }
            if (!this.isCurrent(context)) {
              stale = true
              for (const assetId of invalidatedAssetIds) this.options.assetStore.invalidate(assetId)
              this.options.onOperation?.(finishImageGenerationOperation(operation, {
                status: 'cancelled',
                stage: 'cancelled',
                outcome: 'generation_failed_fallback',
                fallback: 'static',
                failure: { code: 'stale_operation', message: 'Resolved visual asset was superseded' },
              }))
              settleJob()
              return
            }

            operation = {
              ...operation,
              ...(generation.operation ?? {}),
              operationId: jobId,
              assetId: canonical.id,
              entityId: canonical.entityId,
              visualArchetype: canonical.visualArchetype,
              bindingAssetIds,
              bindingEntityIds,
              status: 'running',
              stage: 'applying',
              artifactStatus: 'published',
              manifestStatus: 'updated',
              assetResolutionStatus: 'resolved',
              rendererStatus: 'pending',
              outcome: 'generated_but_not_applied',
              output: { resource: generation.asset.resource, metadata: generation.asset.metadata },
            }
            this.options.onOperation?.(operation)
            generatedCanonicalAssetIds.push(canonical.id)
            reboundAssetIds.push(...bindingAssetIds)
            removedAssetIds.push(...removedFromManifest)
            manifest = nextManifest
            manifestRevision += 1
            this.emit({ stage: 'ASSET_GENERATED', operationId: plan.operationId, worldId: context.worldId, canonicalAssetId: canonical.id, assetIds: bindingAssetIds, entityIds: bindingEntityIds })
            this.options.onManifestCommitted?.({ operationId: plan.operationId, manifest, manifestRevision, affectedAssetIds: invalidatedAssetIds })
            this.emit({ stage: 'MANIFEST_REBOUND', operationId: plan.operationId, worldId: context.worldId, canonicalAssetId: canonical.id, assetIds: bindingAssetIds, entityIds: bindingEntityIds })
            this.emit({ stage: 'ASSET_RESOLVED', operationId: plan.operationId, worldId: context.worldId, canonicalAssetId: canonical.id, assetIds: bindingAssetIds, entityIds: bindingEntityIds })
          } catch (error) {
            manifest = previousManifest
            await this.restorePreviousResources(previousManifest, invalidatedAssetIds)
            const message = error instanceof Error ? error.message : 'Visual asset execution failed'
            failedAssetIds.push(canonical.id)
            fallbackAssetIds.push(...bindingAssetIds)
            this.options.onOperation?.(finishImageGenerationOperation(operation, {
              status: 'failed',
              stage: 'fallback',
              artifactStatus: 'failed',
              outcome: 'generation_failed_fallback',
              fallback: 'static',
              failure: { code: failureCode(message), message },
            }))
          }
          settleJob()
        },
      })
    }
    return execution
  }

  private executeManifestOnly(
    plan: VisualEvolutionPlan,
    currentManifest: AssetManifest,
    context: VisualAssetEvolutionExecutionContext,
  ): VisualAssetExecutionResult {
    const nextManifest = buildTargetedAssetManifest(plan.updatedAssetSpecification, currentManifest)
    const nextIds = new Set(nextManifest.entries.map(entry => entry.assetId))
    const removedAssetIds = currentManifest.entries.filter(entry => !nextIds.has(entry.assetId)).map(entry => entry.assetId)
    const affectedAssetIds = unique(removedAssetIds)
    for (const assetId of affectedAssetIds) this.options.assetStore.invalidate(assetId)
    const changed = nextManifest !== currentManifest
    const manifestRevision = changed ? context.manifestRevision + 1 : context.manifestRevision
    if (changed) {
      this.options.onManifestCommitted?.({ operationId: plan.operationId, manifest: nextManifest, manifestRevision, affectedAssetIds })
      this.emit({ stage: 'MANIFEST_REBOUND', operationId: plan.operationId, worldId: context.worldId, assetIds: affectedAssetIds })
    }
    const result = resultBase(plan, context, changed ? 'completed' : 'already_synced', manifestRevision, {
      removedAssetIds: freezeArray(removedAssetIds),
      retainedAssetIds: freezeArray([...nextIds].filter(assetId => !removedAssetIds.includes(assetId))),
      previousVisualRetained: false,
    })
    this.emit({ stage: 'VISUAL_SYNC_COMPLETED', operationId: plan.operationId, worldId: context.worldId, assetIds: affectedAssetIds })
    return result
  }

  private isCurrent(context: VisualAssetEvolutionExecutionContext): boolean {
    return this.options.isCurrent?.(context) ?? true
  }

  private async restorePreviousResources(manifest: AssetManifest, assetIds: readonly string[]): Promise<void> {
    for (const assetId of assetIds) {
      if (!manifest.entries.some(entry => entry.assetId === assetId)) continue
      this.options.assetStore.invalidate(assetId)
      try {
        await this.options.assetStore.resolve(assetId, manifest)
      } catch {
        // Restoring the old cache is best-effort; the manifest remains authoritative.
      }
    }
  }

  private emit(progress: VisualAssetExecutionProgress): void {
    this.options.onProgress?.(freeze({ ...progress, ...(progress.assetIds ? { assetIds: freezeArray(progress.assetIds) } : {}), ...(progress.entityIds ? { entityIds: freezeArray(progress.entityIds) } : {}) }))
  }
}

export { VisualAssetEvolutionExecutor as DefaultVisualAssetEvolutionExecutor }
