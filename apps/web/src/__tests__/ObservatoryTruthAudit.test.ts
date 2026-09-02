import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { World } from '@genesis/shared'
import ObservatoryOverview from '../components/observatory/ObservatoryOverview.vue'
import ObservatoryTraceViewer from '../components/observatory/trace/ObservatoryTraceViewer.vue'
import ObservatoryTimelineViewer from '../components/observatory/timeline/ObservatoryTimelineViewer.vue'
import ObservatoryHistoryViewer from '../components/observatory/history/ObservatoryHistoryViewer.vue'
import ObservatoryDiffViewer from '../components/observatory/diff/ObservatoryDiffViewer.vue'
import ObservatoryEventStream from '../components/observatory/events/ObservatoryEventStream.vue'
import ObservatoryTraceGraph from '../components/observatory/graph/ObservatoryTraceGraph.vue'
import ObservatoryWorldGraph from '../components/observatory/world/ObservatoryWorldGraph.vue'
import ObservatoryRuntimeViewer from '../components/observatory/runtime/ObservatoryRuntimeViewer.vue'
import ObservatoryGeneration from '../components/observatory/ObservatoryGeneration.vue'
import { useObservatoryDataStore } from '../stores/observatoryData'
import { PROJECT_METADATA } from '../projectMetadata'

function world(...ids: string[]): World {
  return {
    entities: ids.map((id, index) => ({
      id,
      type: index === 0 ? 'player' : 'npc',
      x: index * 10,
      y: 400,
      components: [{ type: 'position', properties: { x: index * 10, y: 400 } }],
    })),
  }
}

function generation(provider = 'codex-cli') {
  return {
    trace: {
      id: 'generation-current',
      source: 'ai',
      status: 'success',
      provider,
      model: 'current-model',
      stages: [{ name: 'REQUEST', status: 'completed' }],
    },
    candidateDisposition: 'accepted',
    selectionOutcome: 'provider_accepted',
    specification: {
      title: 'Current Farm',
      genre: 'simulation',
      objectives: [],
      entities: [],
    },
    validationStatus: 'valid',
    validationErrors: [],
    worldEntityIds: ['player', 'cow'],
  }
}

describe('WO-OBS-001 Observatory truthfulness', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts empty and never auto-loads the legacy overview fixture', () => {
    const store = useObservatoryDataStore()
    mount(ObservatoryOverview)
    expect(store.viewModel.runtimeView.entityCount).toBe(0)
    expect(store.viewModel.traceView).toEqual([])
    expect(document.body.textContent).not.toContain('v1.29')
  })

  it('shows the current Runtime entity count', () => {
    useObservatoryDataStore().loadRuntimeWorld(world('player', 'cow'))
    expect(mount(ObservatoryOverview).text()).toContain('Runtime entities2')
  })

  it('shows the real current generation provider', () => {
    useObservatoryDataStore().loadGenerationTrace(generation('api-compatible'))
    expect(mount(ObservatoryOverview).text()).toContain('Providerapi-compatible')
  })

  it('replaces current-world facts when a new world arrives', () => {
    const store = useObservatoryDataStore()
    store.loadRuntimeWorld(world('old-player', 'old-npc'))
    store.loadRuntimeWorld(world('new-player'))
    const text = mount(ObservatoryOverview).text()
    expect(text).toContain('Runtime entities1')
    expect(text).not.toContain('old-player')
  })

  it('keeps Runtime bound to real current entities', () => {
    useObservatoryDataStore().loadRuntimeWorld(world('player', 'merchant'))
    const text = mount(ObservatoryRuntimeViewer).text()
    expect(text).toContain('merchant')
    expect(text).not.toContain('guard-001')
    expect(text).not.toContain('runtime-world')
  })

  it('keeps Generation Trace bound to real diagnostics', () => {
    useObservatoryDataStore().loadGenerationTrace(generation())
    const text = mount(ObservatoryGeneration).text()
    expect(text).toContain('generation-current')
    expect(text).toContain('codex-cli')
  })

  it('exposes product-incomplete fallback without labeling it as provider failure', () => {
    const trace = generation()
    useObservatoryDataStore().loadGenerationTrace({
      ...trace,
      trace: { ...trace.trace, source: 'deterministic', status: 'fallback' },
      candidateDisposition: 'product_incomplete',
      selectionOutcome: 'deterministic_fallback',
      validationStatus: 'invalid',
      validationErrors: ['platformer baseline requires a goal entity'],
    })
    const text = mount(ObservatoryGeneration).text()
    expect(text).toContain('deterministic_fallback')
    expect(text).toContain('product_incomplete')
    expect(text).not.toContain('provider_failed')
  })

  it.each([
    [ObservatoryTraceViewer, 'No trace available for the current session/operation.'],
    [ObservatoryTimelineViewer, 'No timeline events recorded for this session.'],
    [ObservatoryHistoryViewer, 'No prior world operations recorded in this session.'],
    [ObservatoryDiffViewer, 'No semantic world delta recorded.'],
    [ObservatoryEventStream, 'No domain events available.'],
  ])('renders an honest empty state for %s', (component, message) => {
    expect(mount(component).text()).toContain(message)
  })

  it('does not present the retired execution topology as live', () => {
    const text = mount(ObservatoryTraceGraph).text()
    expect(text).toContain('No live execution graph')
    expect(text).not.toContain('CreateFarm')
  })

  it('projects World Graph from only the current Runtime world', () => {
    const store = useObservatoryDataStore()
    store.loadRuntimeWorld(world('world-a-player', 'world-a-npc'))
    store.loadRuntimeWorld(world('world-b-player'))
    const text = mount(ObservatoryWorldGraph).text()
    expect(text).toContain('world-b-player')
    expect(text).not.toContain('world-a-player')
    expect(text).not.toContain('HarvestQuest')
  })

  it('does not expose credential-shaped metadata', () => {
    const store = useObservatoryDataStore()
    store.loadGenerationTrace({ ...generation(), apiKey: 'secret-key', headers: { authorization: 'Bearer secret' } })
    const text = mount(ObservatoryGeneration).text()
    expect(text).not.toContain('secret-key')
    expect(text).not.toContain('Bearer secret')
  })

  it('uses the centralized current architecture and Sprint metadata', () => {
    const text = mount(ObservatoryOverview).text()
    expect(PROJECT_METADATA).toEqual({
      architectureVersion: 'v1.186',
      currentSprint: 'Sprint 37',
    })
    expect(text).toContain(PROJECT_METADATA.architectureVersion)
    expect(text).toContain(PROJECT_METADATA.currentSprint)
    expect(PROJECT_METADATA.architectureVersion).not.toBe('v1.177')
    expect(PROJECT_METADATA.currentSprint).not.toBe('Sprint 27')
    expect(text).not.toContain('v1.29')
  })
})
