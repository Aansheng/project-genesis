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
  function loadRuntimeWorld(world: World): void {
    const runtimeView = {
      worldId: '',
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
    viewModel.value = Object.freeze({
      ...EMPTY_VIEW_MODEL,
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
  }
})

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
