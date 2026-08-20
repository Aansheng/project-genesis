import { defineStore } from 'pinia'
import { ref } from 'vue'
import { DefaultObservatoryAdapter } from '../adapters/observatory'
import type { ObservatoryViewModel } from '../adapters/observatory'
import { DefaultObservatoryMetadataBridge } from '../adapters/observatory/bridge'
import { EMPTY_BRIDGE_DATA } from '../adapters/observatory/bridge'
import type { ObservatoryBridgeData } from '../adapters/observatory/bridge'
import { DefaultObservatoryMapper } from '../adapters/observatory/mapping'
import type { ObservatoryMapper } from '../adapters/observatory/mapping'
import type { World } from '@genesis/shared'
import type { WorldSemanticDelta, WorldEvolutionOperation, RuntimeEvolutionResult, VisualEvolutionPlan } from '@genesis/shared'
import type { WorldEvolutionPlanResult } from '@genesis/ai'

export interface ObservatoryGenerationStage {
  readonly name: string
  readonly status: string
  readonly error?: string
}

export interface ObservatoryGenerationTrace {
  readonly id: string
  readonly source: 'ai' | 'deterministic'
  readonly status: 'success' | 'fallback' | 'failed'
  readonly provider?: string
  readonly model?: string
  readonly stages: readonly ObservatoryGenerationStage[]
  readonly candidate?: {
    readonly title?: string
    readonly genre?: string
    readonly theme?: string
    readonly difficulty?: string
    readonly objectives: readonly string[]
    readonly entities: readonly { id: string; category: string; name: string; role?: string }[]
  }
  readonly specification?: {
    readonly title?: string
    readonly genre?: string
    readonly theme?: string
    readonly difficulty?: string
    readonly objectives: readonly string[]
    readonly entities: readonly { id: string; category: string; name: string; role?: string }[]
  }
  readonly world?: { readonly entityCount: number; readonly entityIds: readonly string[] }
  readonly validation?: { readonly status: string; readonly errors: readonly string[] }
  readonly fallbackReason?: string
}

// ---------------------------------------------------------------------------

const adapter = new DefaultObservatoryAdapter()
const bridge = new DefaultObservatoryMetadataBridge()
const mapper: ObservatoryMapper = new DefaultObservatoryMapper()
const EMPTY_VIEW_MODEL = adapter.adapt(undefined)

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

/**
 * Observatory Data Store — owns the current ObservatoryViewModel.
 *
 * Design principles:
 * - Pure data ownership: no UI logic, no rendering
 * - Adapter-driven: counts derived through DefaultObservatoryAdapter
 * - No AI package imports
 * - No Runtime integration
 * - No Planner integration
 */
export const useObservatoryDataStore = defineStore('observatoryData', () => {
  const viewModel = ref<ObservatoryViewModel>(EMPTY_VIEW_MODEL)
  const bridgeData = ref<ObservatoryBridgeData>(EMPTY_BRIDGE_DATA)
  const generationTrace = ref<ObservatoryGenerationTrace | null>(null)

  function recordWorldEvolution(plan: WorldEvolutionPlanResult): void {
    const operation = plan.operation
    const current = viewModel.value
    const traceView = upsertById(current.traceView, buildEvolutionTrace(operation))
    const timelineView = upsertById(current.timelineView, buildEvolutionTimeline(operation))
    const historyView = upsertById(current.historyView, buildEvolutionHistory(operation))
    const diff = plan.status === 'validated' ? buildEvolutionDiff(operation, plan.delta, plan.mutation, plan.runtimeSync, plan.visualPlan) : undefined
    const diffView = diff ? upsertById(current.diffView, diff) : current.diffView
    const operationEventIds = new Set(operation.events.map(event => event.id))
    const events = Object.freeze([
      ...operation.events.map(event => Object.freeze({
        id: event.id,
        timestamp: event.timestamp,
        level: event.type === 'world.evolution.semantic_application_failed' || event.type === 'world.evolution.runtime_sync_failed' || event.type === 'world.evolution.visual_delta_failed'
          ? 'error' as const
          : event.type === 'world.evolution.validation_failed' || event.type === 'world.evolution.needs_clarification'
            ? 'warning' as const
            : 'info' as const,
        source: 'world-evolution',
        type: event.type,
        message: event.message,
      })),
      ...current.eventStreamView.events.filter(event => !operationEventIds.has(event.id)),
    ])
    viewModel.value = Object.freeze({
      ...current,
      overview: Object.freeze({
        traceCount: traceView.length,
        timelineCount: timelineView.length,
        historyCount: historyView.length,
      }),
      traceView,
      timelineView,
      historyView,
      diffView,
      eventStreamView: Object.freeze({ events }),
    })
  }

  /** Keep only the active world's evolution projections in the current SPA session. */
  function resetEvolution(_worldId: string): void {
    const runtimeView = viewModel.value.runtimeView
    viewModel.value = Object.freeze({
      ...EMPTY_VIEW_MODEL,
      runtimeView,
    })
    bridgeData.value = EMPTY_BRIDGE_DATA
  }

  function loadGenerationTrace(raw: unknown): void {
    if (!isRecord(raw) || !isRecord(raw.trace)) {
      generationTrace.value = null
      return
    }
    const trace = raw.trace
    const candidate = semanticDesign(raw.candidate)
    const specification = semanticDesign(raw.specification)
    generationTrace.value = Object.freeze({
      id: stringValue(trace.id, 'generation'),
      source: trace.source === 'ai' ? 'ai' : 'deterministic',
      status: trace.status === 'fallback' ? 'fallback' : trace.status === 'failed' ? 'failed' : 'success',
      ...(typeof trace.provider === 'string' ? { provider: trace.provider } : {}),
      ...(typeof trace.model === 'string' ? { model: trace.model } : {}),
      stages: Object.freeze(Array.isArray(trace.stages) ? trace.stages.filter(isRecord).map(stage => Object.freeze({
        name: stringValue(stage.name, 'UNKNOWN'),
        status: stringValue(stage.status, 'not-applicable'),
        ...(typeof stage.error === 'string' ? { error: stage.error } : {}),
      })) : []),
      ...(candidate ? { candidate } : {}),
      ...(specification ? { specification } : {}),
      validation: {
        status: raw.validationStatus === 'valid' ? 'passed' : 'failed',
        errors: stringArray(raw.validationErrors),
      },
      ...(Array.isArray(raw.worldEntityIds) ? { world: { entityCount: raw.worldEntityIds.length, entityIds: stringArray(raw.worldEntityIds) } } : {}),
      ...(typeof raw.fallbackReason === 'string' ? { fallbackReason: raw.fallbackReason } : {}),
    })
  }

  /** Compatibility hook for legacy UI tests. Production has no fixture. */
  function loadMockObservatory(): void {
    const mock = (globalThis as typeof globalThis & {
      __GENESIS_OBSERVATORY_TEST_FIXTURE__?: unknown
    }).__GENESIS_OBSERVATORY_TEST_FIXTURE__
    if (mock === undefined) return
    bridgeData.value = EMPTY_BRIDGE_DATA
    viewModel.value = adapter.adapt(mock)
  }

  /**
   * Load real observatory data from PromptBuilder metadata.
   *
   * PRIMARY PATH — this is the canonical way to load Observatory data.
   * Accepts raw metadata (unknown), chains through the existing pipeline:
   *
   *   Bridge → Mapper → Adapter → ViewModel
   *
   * Uses DefaultObservatoryMetadataBridge to extract known keys.
   * Stores the result in bridgeData.
   * Recomputes viewModel from bridge data when non-empty.
   *
   * Real metadata has priority — viewModel is computed from real data,
   * not from mock data. Call loadMockObservatory() to restore mock data.
   */
  function loadRealObservatory(metadata: unknown): void {
    const result = bridge.adapt(metadata)
    bridgeData.value = result
    const mapped = mapper.map(result)
    const keys = Object.keys(mapped)
    if (keys.length > 0) {
      viewModel.value = adapter.adapt(mapped as Record<string, unknown>)
    } else {
      viewModel.value = EMPTY_VIEW_MODEL
    }
  }

  /** Replace only the runtime section from the authoritative Runtime world. */
  function loadRuntimeWorld(world: World, worldId?: string): void {
    const runtimeView = {
      worldId: worldId ?? viewModel.value.runtimeView.worldId,
      entityCount: world.entities.length,
      systemCount: 0,
      eventCount: 0,
      fps: 0,
      entities: world.entities.map((entity) => ({
        id: entity.id,
        type: entity.type,
        position: (() => {
          const component = entity.components?.find((item) => item.type === 'position')
          return component ? JSON.stringify({ x: component.properties.x, y: component.properties.y }) : ''
        })(),
        health: '',
        state: '',
        components: (entity.components ?? []).map((component) => ({
          name: component.type,
          data: component.properties,
        })),
      })),
    }

    const next = adapter.adapt({ runtimeView })
    const current = viewModel.value
    viewModel.value = Object.freeze({
      ...current,
      runtimeView: next.runtimeView,
    })
    bridgeData.value = EMPTY_BRIDGE_DATA
  }

  return {
    viewModel,
    bridgeData,
    generationTrace,
    loadGenerationTrace,
    loadMockObservatory,
    loadRealObservatory,
    loadRuntimeWorld,
    recordWorldEvolution,
    resetEvolution,
  }
})

function upsertById<T extends { readonly id: string }>(items: readonly T[], next: T): readonly T[] {
  const index = items.findIndex(item => item.id === next.id)
  if (index < 0) return Object.freeze([...items, next])
  const updated = [...items]
  updated[index] = next
  return Object.freeze(updated)
}

function buildEvolutionTrace(operation: WorldEvolutionOperation): ObservatoryViewModel['traceView'][number] {
  return Object.freeze({
    id: `trace-${operation.operationId}`,
    strategy: `World Evolution · ${operation.source}`,
    timestamp: operation.createdAt,
    plan: `${operation.instruction}\n\n${operation.stages.map(stage => `${stage.name}: ${stage.status}`).join('\n')}`,
    snapshot: Object.freeze([
      { key: 'operationId', value: operation.operationId },
      { key: 'worldId', value: operation.worldId },
      { key: 'status', value: operation.status },
      ...(operation.semanticRevision !== undefined ? [{ key: 'semanticRevision', value: String(operation.semanticRevision) }] : []),
      ...(operation.runtimeSemanticRevision !== undefined ? [{ key: 'runtimeSemanticRevision', value: String(operation.runtimeSemanticRevision) }] : []),
      ...(operation.runtimeSynchronization ? [{ key: 'runtimeSynchronization', value: operation.runtimeSynchronization }] : []),
      ...(operation.visualRevision !== undefined ? [{ key: 'visualRevision', value: String(operation.visualRevision) }] : []),
      ...(operation.visualPlanning ? [{ key: 'visualPlanning', value: operation.visualPlanning }] : []),
      ...(operation.visualGenerationRequired !== undefined ? [{ key: 'visualGenerationRequired', value: String(operation.visualGenerationRequired) }] : []),
      { key: 'targets', value: operation.resolvedTargetIds.join(', ') || 'none' },
    ]),
    metadata: Object.freeze({
      source: operation.source,
      ...(operation.provider ? { provider: operation.provider } : {}),
      ...(operation.model ? { model: operation.model } : {}),
      operationId: operation.operationId,
      worldId: operation.worldId,
      status: operation.status,
      ...(operation.semanticRevision !== undefined ? { semanticRevision: operation.semanticRevision } : {}),
      ...(operation.runtimeSemanticRevision !== undefined ? { runtimeSemanticRevision: operation.runtimeSemanticRevision } : {}),
      ...(operation.runtimeSynchronization ? { runtimeSynchronization: operation.runtimeSynchronization } : {}),
      ...(operation.visualRevision !== undefined ? { visualRevision: operation.visualRevision } : {}),
      ...(operation.visualPlanning ? { visualPlanning: operation.visualPlanning } : {}),
      ...(operation.visualGenerationRequired !== undefined ? { visualGenerationRequired: operation.visualGenerationRequired } : {}),
    }),
    operationId: operation.operationId,
    worldId: operation.worldId,
    status: operation.status,
  })
}

function buildEvolutionTimeline(operation: WorldEvolutionOperation): ObservatoryViewModel['timelineView'][number] {
  return Object.freeze({
    id: `timeline-${operation.operationId}`,
    entryCount: operation.stages.length,
    entries: Object.freeze(operation.stages.map((stage, index) => Object.freeze({
      index,
      strategy: `${stage.name} · ${stage.status}`,
      timestamp: stage.timestamp,
    }))),
  })
}

function buildEvolutionHistory(operation: WorldEvolutionOperation): ObservatoryViewModel['historyView'][number] {
  const semanticApplied = operation.status === 'semantic_applied'
    || operation.status === 'runtime_synchronized'
    || operation.status === 'runtime_sync_failed'
    || operation.status === 'visual_delta_planned'
    || operation.status === 'visual_planning_failed'
  const semanticFailed = operation.status === 'semantic_application_failed'
  const runtimeFailed = operation.status === 'runtime_sync_failed'
  const runtimeSynchronized = operation.status === 'runtime_synchronized'
    || operation.status === 'visual_delta_planned'
    || operation.status === 'visual_planning_failed'
  const visualPlanned = operation.status === 'visual_delta_planned'
  const visualFailed = operation.status === 'visual_planning_failed'
  const runtimeResult = operation.runtimeSynchronization === 'no_runtime_impact'
    ? 'Runtime no runtime impact'
    : 'Runtime synchronized'
  const visualResult = operation.visualGenerationRequired && operation.visualGenerationRequired > 0
    ? 'Asset execution pending'
    : 'no asset generation required'
  return Object.freeze({
    id: `history-${operation.operationId}`,
    timestamp: operation.createdAt,
    prompt: operation.instruction,
    result: visualPlanned
      ? `Semantic change applied; ${runtimeResult}; Visual delta planned; ${visualResult}`
      : visualFailed
        ? `Semantic change applied; ${runtimeResult}; Visual planning failed: ${operation.failureReason ?? 'unknown error'}`
        : runtimeSynchronized
          ? operation.runtimeSynchronization === 'no_runtime_impact'
            ? 'Semantic change applied; Runtime no runtime impact; Visual planning pending'
            : 'Semantic change applied; Runtime synchronized; Visual planning pending'
          : runtimeFailed
        ? `Semantic change applied; Runtime synchronization failed: ${operation.failureReason ?? 'unknown error'}`
        : semanticApplied
          ? 'Semantic change applied; Runtime synchronization pending'
          : semanticFailed
            ? `Semantic application failed: ${operation.failureReason ?? 'unknown error'}`
            : operation.status === 'validated'
              ? 'Validated plan; Runtime unchanged'
              : `${operation.status}: ${operation.failureReason ?? 'no semantic delta produced'}`,
    evolution: Object.freeze(operation.deltaSummary ? [{ name: operation.deltaSummary }] : []),
    operationId: operation.operationId,
    worldId: operation.worldId,
    status: operation.status,
    ...(operation.semanticRevision !== undefined ? { semanticRevision: operation.semanticRevision } : {}),
    ...(operation.runtimeSynchronization
      ? { runtimeSynchronization: operation.runtimeSynchronization }
      : semanticApplied ? { runtimeSynchronization: 'pending' as const } : {}),
    ...(operation.runtimeSemanticRevision !== undefined ? { runtimeSemanticRevision: operation.runtimeSemanticRevision } : {}),
    ...(operation.visualRevision !== undefined ? { visualRevision: operation.visualRevision } : {}),
    ...(operation.visualPlanning ? { visualPlanning: operation.visualPlanning } : {}),
    ...(operation.visualGenerationRequired !== undefined ? { visualGenerationRequired: operation.visualGenerationRequired } : {}),
    ...(operation.failureReason ? { failureReason: operation.failureReason } : {}),
  })
}

function buildEvolutionDiff(
  operation: WorldEvolutionOperation,
  delta: WorldSemanticDelta,
  mutation?: Extract<WorldEvolutionPlanResult, { readonly status: 'validated' }>['mutation'],
  runtimeSync?: RuntimeEvolutionResult,
  visualPlan?: VisualEvolutionPlan,
): ObservatoryViewModel['diffView'][number] {
  const added: { readonly name: string }[] = []
  const removed: { readonly name: string }[] = []
  const changed: { readonly name: string }[] = []
  for (const item of delta.operations) {
    if (item.kind === 'add-entity') {
      if (mutation?.status === 'applied' && mutation.addedEntities.length > 0) {
        added.push(...mutation.addedEntities.map(entity => ({ name: `${entity.id}: ${entity.name}` })))
      } else {
        added.push({ name: `${item.semantic.name} ×${item.count}` })
      }
    }
    if (item.kind === 'remove-entity') removed.push(...item.targetIds.map(id => ({ name: id })))
    if (item.kind === 'replace-entity-semantic') changed.push(...item.targetIds.map((id, index) => ({ name: `${id}: ${item.from[index]?.name ?? item.from[0]?.name ?? 'semantic'} → ${item.replacement.name}` })))
    if (item.kind === 'update-world-property') changed.push({ name: `${item.property}: ${item.from ?? 'unset'} → ${item.to}` })
  }
  if (visualPlan) {
    for (const replacement of visualPlan.replacedVisualRequirements) {
      changed.push({
        name: `Visual: ${replacement.before.visualArchetype ?? replacement.before.subject} → ${replacement.after.visualArchetype ?? replacement.after.subject}`,
      })
    }
    for (const requirement of visualPlan.addedVisualRequirements) {
      changed.push({ name: `Visual archetype added: ${requirement.visualArchetype ?? requirement.subject}` })
    }
    for (const requirement of visualPlan.removedVisualRequirements) {
      changed.push({ name: `Visual archetype removed: ${requirement.visualArchetype ?? requirement.subject}` })
    }
    for (const impact of visualPlan.worldLevelVisualImpact) {
      changed.push({ name: `Visual ${impact.property}: ${impact.reason}` })
    }
    for (const binding of visualPlan.bindingOnlyChanges) {
      changed.push({ name: `Visual binding ${binding.action.toLocaleLowerCase()}: ${binding.entityId ?? binding.assetId ?? 'unknown'}` })
    }
    if (visualPlan.generationRequired.length > 0) {
      changed.push({ name: `Asset execution: ${visualPlan.generationRequired.length} canonical visual requirement(s) pending` })
    } else if (visualPlan.noVisualImpactReason) {
      changed.push({ name: `Asset execution: ${visualPlan.noVisualImpactReason}` })
    }
  }
  return Object.freeze({
    id: `diff-${operation.operationId}`,
    timestamp: operation.createdAt,
    added: Object.freeze(added),
    removed: Object.freeze(removed),
    changed: Object.freeze(changed),
    operationId: operation.operationId,
    worldId: operation.worldId,
    status: operation.status === 'semantic_applied' || operation.status === 'runtime_synchronized' || operation.status === 'runtime_sync_failed' || operation.status === 'visual_delta_planned' || operation.status === 'visual_planning_failed'
      ? 'applied' as const
      : 'planned' as const,
    targetIds: Object.freeze([...operation.resolvedTargetIds]),
    ...(operation.semanticRevision !== undefined ? { semanticRevision: operation.semanticRevision } : {}),
    ...(operation.runtimeSynchronization
      ? { runtimeSynchronization: operation.runtimeSynchronization }
      : operation.status === 'semantic_applied' ? { runtimeSynchronization: 'pending' as const } : {}),
    ...(runtimeSync ? {
      runtimeAffectedEntityIds: Object.freeze([...runtimeSync.affectedEntityIds]),
      runtimeAddedEntityIds: Object.freeze([...runtimeSync.addedEntityIds]),
      runtimeRemovedEntityIds: Object.freeze([...runtimeSync.removedEntityIds]),
    } : {}),
    ...(visualPlan ? {
      visualRevision: visualPlan.updatedVisualRevision,
      visualPlanning: visualPlan.status === 'failed'
        ? 'failed' as const
        : visualPlan.status === 'no_visual_impact' ? 'no_visual_impact' as const : 'planned' as const,
      visualGenerationRequired: visualPlan.generationRequired.length,
      visualAffectedArchetypes: Object.freeze([...new Set([
        ...visualPlan.oldArchetypes.flatMap(archetype => archetype.visualArchetype ? [archetype.visualArchetype] : []),
        ...visualPlan.newArchetypes.flatMap(archetype => archetype.visualArchetype ? [archetype.visualArchetype] : []),
      ])]),
      visualBindingOnlyEntityIds: Object.freeze([...new Set(visualPlan.bindingOnlyChanges.flatMap(change => change.entityId ? [change.entityId] : []))]),
      visualOrphanedAssetIds: Object.freeze([...visualPlan.assetImpactPlan.orphanedAssetIds]),
    } : {}),
    ...(operation.failureReason ? { failureReason: operation.failureReason } : {}),
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function semanticDesign(value: unknown): ObservatoryGenerationTrace['candidate'] | undefined {
  if (!isRecord(value)) return undefined
  const entities = Array.isArray(value.entities) ? value.entities.filter(isRecord).map(entity => ({
    id: stringValue(entity.id, 'unknown'),
    category: stringValue(entity.category, 'unknown'),
    name: stringValue(entity.name, 'unknown'),
    ...(typeof entity.role === 'string' ? { role: entity.role } : {}),
  })) : []
  return {
    ...(typeof value.title === 'string' ? { title: value.title } : {}),
    ...(typeof value.genre === 'string' ? { genre: value.genre } : {}),
    ...(isRecord(value.theme) && typeof value.theme.name === 'string' ? { theme: value.theme.name } : {}),
    ...(typeof value.difficulty === 'string' ? { difficulty: value.difficulty } : {}),
    objectives: Array.isArray(value.objectives) ? value.objectives.filter(isRecord).map(item => stringValue(item.type, 'unknown')) : [],
    entities,
  }
}
