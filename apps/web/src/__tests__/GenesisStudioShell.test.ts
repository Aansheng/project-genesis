import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { nextTick } from 'vue'
import App from '../App.vue'
import { createAppRouter } from '../router'
import { useGameStore } from '../stores/gameStore'
import { useObservatoryDataStore } from '../stores/observatoryData'
import { createPositionComponent } from '@genesis/shared'

const lifecycle = vi.hoisted(() => ({
  pixiCreated: 0,
  pixiDestroyed: 0,
  runnerStarted: 0,
  runnerStopped: 0,
  loopStopped: 0,
  inputAttached: 0,
  inputDetached: 0,
  resizeObserverCreated: 0,
  resizeObserverObserved: 0,
  resizeObserverDisconnected: 0,
  resize: 0,
  resizeCallback: null as (() => void) | null,
}))

vi.mock('pixi.js', () => ({
  Application: class {
    readonly view = document.createElement('canvas')
    readonly stage = { addChild: vi.fn() }
    readonly renderer = { resize: vi.fn(() => lifecycle.resize++) }

    constructor() {
      lifecycle.pixiCreated++
    }

    destroy() {
      lifecycle.pixiDestroyed++
      this.view.remove()
    }
  },
  Container: class {},
}))

vi.mock('@genesis/renderer', () => ({
  DefaultRuntimeRendererAdapter: class {},
  DefaultPixiEntityRenderer: class {},
  DefaultRuntimeVisualizationLoop: class {
    stop() {
      lifecycle.loopStopped++
    }
  },
  DefaultAnimationFrameScheduler: class {},
  DefaultVisualizationRunner: class {
    start() {
      lifecycle.runnerStarted++
    }

    stop() {
      lifecycle.runnerStopped++
    }
  },
  StoreBackedWorldProvider: class {},
  DefaultEntityVisualCatalog: class {},
  KeyboardInputProvider: class {
    attach() {
      lifecycle.inputAttached++
    }

    detach() {
      lifecycle.inputDetached++
    }
  },
  DefaultCameraController: class {},
}))

async function mountStudio(path = '/') {
  const pinia = createPinia()
  const router = createAppRouter(createMemoryHistory())
  await router.push(path)
  await router.isReady()
  const wrapper = mount(App, {
    attachTo: document.body,
    global: { plugins: [pinia, router] },
  })
  await nextTick()
  return { wrapper, pinia, router }
}

beforeEach(() => {
  for (const key of Object.keys(lifecycle) as Array<keyof typeof lifecycle>) {
    if (key !== 'resizeCallback') lifecycle[key] = 0 as never
  }
  lifecycle.resizeCallback = null
  document.body.className = ''
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: () => void) {
      lifecycle.resizeObserverCreated++
      lifecycle.resizeCallback = callback
    }

    observe() {
      lifecycle.resizeObserverObserved++
    }

    disconnect() {
      lifecycle.resizeObserverDisconnected++
    }
  })
})

describe('Genesis Studio Shell Foundation', () => {
  it('applies the visual system without introducing product state', async () => {
    const { wrapper } = await mountStudio()
    const shell = wrapper.find('.genesis-studio-shell')

    expect(shell.attributes('style')).toBeUndefined()
    expect(shell.classes()).toContain('genesis-studio-shell')
    expect(wrapper.find('.brand-mark').exists()).toBe(true)
    expect(wrapper.find('.panel-kicker').exists()).toBe(true)
    expect(wrapper.find('.viewport-status').text()).toBe('Empty')
    expect(wrapper.find('.viewport-controls').text()).toContain('Arrow Keys')
    expect(wrapper.find('.viewport-controls').text()).toContain('Space')
    expect(wrapper.find('.studio-command-bar button').text()).toBe('Generate')
    expect(useGameStore().commandStatus).toBe('idle')
    expect(wrapper.text()).not.toMatch(/model|latency|tokens|saved|sync/i)

    wrapper.unmount()
  })

  it('renders the unified empty Studio without mock world data', async () => {
    const { wrapper } = await mountStudio()

    expect(wrapper.find('.genesis-studio-shell').exists()).toBe(true)
    expect(wrapper.find('.studio-header').exists()).toBe(true)
    expect(wrapper.find('.studio-workspace').exists()).toBe(true)
    expect(wrapper.find('.world-explorer-panel').exists()).toBe(true)
    expect(wrapper.find('.game-viewport-panel').exists()).toBe(true)
    expect(wrapper.find('.inspector-panel').exists()).toBe(true)
    expect(wrapper.find('.studio-command-bar').exists()).toBe(true)
    expect(wrapper.text()).toContain('No world generated yet')
    expect(wrapper.find('.viewport-empty-state').text()).toContain('No game world yet')
    expect(wrapper.text()).toContain('No runtime world available')
    expect(wrapper.text()).not.toContain('guard-001')
    expect(wrapper.text()).not.toContain('merchant-001')
    expect(wrapper.findAll('.game-container canvas')).toHaveLength(1)
    expect(lifecycle).toMatchObject({
      pixiCreated: 1,
      runnerStarted: 1,
      inputAttached: 1,
    })

    wrapper.unmount()
  })

  it('resizes the Pixi renderer with the viewport and cleans up the observer', async () => {
    const { wrapper } = await mountStudio()
    const container = wrapper.find('.game-container').element
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      width: 640,
      height: 360,
      top: 0,
      left: 0,
      right: 640,
      bottom: 360,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    lifecycle.resizeCallback?.()
    expect(lifecycle.resizeObserverCreated).toBe(1)
    expect(lifecycle.resizeObserverObserved).toBe(1)
    expect(lifecycle.resize).toBeGreaterThanOrEqual(2)

    wrapper.unmount()
    expect(lifecycle.resizeObserverDisconnected).toBe(1)
  })

  it('creates MarioWorld through the command bar and updates every real surface', async () => {
    const { wrapper, pinia } = await mountStudio()
    const store = useGameStore(pinia)
    const worldStore = store.worldStore

    await wrapper.get('#studio-command-input').setValue('创建 MarioWorld')
    await wrapper.get('.studio-command-bar form').trigger('submit')
    await nextTick()
    await nextTick()

    const world = worldStore.getWorld()
    const expectedIds = [
      'player',
      'terrain',
      'platform',
      'enemy',
      'goal',
      'checkpoint',
    ]

    await vi.waitFor(() => expect(worldStore.getWorld().entities).toHaveLength(6))
    expect(wrapper.findAll('.world-explorer-panel .entity-row')).toHaveLength(6)
    expectedIds.forEach((id) => {
      expect(wrapper.find('.world-explorer-panel').text()).toContain(id)
      expect(wrapper.find('.inspector-panel').text()).toContain(id)
    })
    expect(wrapper.find('.entity-count').text()).toBe('6 entities')
    expect(wrapper.find('.viewport-status').text()).toBe('Running')
    expect(wrapper.find('.runtime-summary').text()).toContain('6')
    expect(wrapper.find('.command-activity').text()).toContain(
      'Created world with 6 entities',
    )
    expect(store.commandStatus).toBe('success')
    expect(wrapper.find('.command-activity strong').text()).toBe('World created')
    expect(wrapper.find('.activity-detail').text()).toBe('6 entities')
    expect(useObservatoryDataStore(pinia).viewModel.runtimeView.entityCount).toBe(6)
    expect(useGameStore(pinia).worldStore).toBe(worldStore)

    wrapper.unmount()
  })

  it('keeps unknown commands truthful and actionable', async () => {
    const { wrapper, pinia } = await mountStudio()
    const store = useGameStore(pinia)

    await wrapper.get('#studio-command-input').setValue('hello world')
    await wrapper.get('.studio-command-bar form').trigger('submit')
    await nextTick()

    expect(store.commandStatus).toBe('error')
    expect(wrapper.find('.command-activity strong').text()).toBe('Command not understood')
    expect(wrapper.find('.command-activity').text()).toContain('Unknown command')
    expect(wrapper.text()).not.toContain('{"actions":[]}')

    wrapper.unmount()
  })

  it('selects a real entity and renders its current runtime details', async () => {
    const { wrapper, pinia } = await mountStudio()
    const store = useGameStore(pinia)
    await store.send('创建 MarioWorld')
    await nextTick()

    const playerRow = wrapper
      .findAll('.entity-row')
      .find((row) => row.text().includes('player'))!
    expect(playerRow.element.tagName).toBe('BUTTON')
    await playerRow.trigger('click')

    expect(store.selectedEntityId).toBe('player')
    expect(playerRow.attributes('aria-pressed')).toBe('true')
    expect(playerRow.classes()).toContain('selected')
    expect(wrapper.find('.entity-inspector').text()).toContain('player')
    expect(wrapper.find('.position-section').text()).toContain('X80')
    expect(wrapper.find('.position-section').text()).toContain('Y300')
    expect(wrapper.find('.component-list').text()).toContain('position')

    wrapper.unmount()
  })

  it('changes selection and follows current runtime position without copying the entity', async () => {
    const { wrapper, pinia } = await mountStudio()
    const store = useGameStore(pinia)
    await store.send('创建 MarioWorld')
    await nextTick()

    await wrapper.findAll('.entity-row')[0].trigger('click')
    await wrapper.findAll('.entity-row')[3].trigger('click')
    expect(store.selectedEntityId).toBe('enemy')
    expect(wrapper.findAll('.entity-row')[0].classes()).not.toContain('selected')
    expect(wrapper.findAll('.entity-row')[3].classes()).toContain('selected')
    expect(wrapper.find('.entity-inspector').text()).toContain('enemy')

    store.selectEntity('player')
    const currentWorld = store.worldStore.getWorld()
    store.worldStore.setWorld({
      entities: currentWorld.entities.map((entity) =>
        entity.id === 'player'
          ? {
              ...entity,
              x: 120,
              components: [createPositionComponent(120, 300)],
            }
          : entity,
      ),
    })
    store.markWorldUpdated()
    await nextTick()

    expect(store.selectedEntity).toBe(store.worldStore.getWorld().entities[0])
    expect(wrapper.find('.position-section').text()).toContain('X120')

    wrapper.unmount()
  })

  it('renders generic component properties without mutating the runtime world', async () => {
    const { wrapper, pinia } = await mountStudio()
    const store = useGameStore(pinia)
    await store.send('创建 MarioWorld')
    const world = store.worldStore.getWorld()
    const customProperties = {
      speed: 3,
      active: true,
      empty: null,
      missing: undefined,
      tags: ['player', 'controllable'],
      nested: { enabled: false, values: [1, 2] },
    }
    store.worldStore.setWorld({
      entities: world.entities.map((entity) => entity.id === 'player'
        ? {
            ...entity,
            components: [
              createPositionComponent(80, 300),
              { type: 'semantic', properties: { category: 'player', name: 'Player' } },
              { type: 'custom', properties: customProperties },
            ],
          }
        : entity),
    })
    store.markWorldUpdated()
    store.selectEntity('player')
    await nextTick()

    const inspector = wrapper.find('.entity-inspector')
    expect(inspector.text()).toContain('Components3')
    expect(inspector.text()).toContain('speed3')
    expect(inspector.text()).toContain('activetrue')
    expect(inspector.text()).toContain('empty—')
    expect(inspector.text()).toContain('missing—')
    expect(inspector.text()).toContain('tags[player, controllable]')
    expect(inspector.text()).toContain('nested.enabledfalse')
    expect(inspector.text()).toContain('nested.values[1, 2]')
    expect(wrapper.findAll('.runtime-component-inspector h4').map((node) => node.text())).toEqual([
      'position',
      'semantic',
      'custom',
    ])
    expect(store.worldStore.getWorld().entities.find((entity) => entity.id === 'player')?.components).toHaveLength(3)

    wrapper.unmount()
  })

  it('switches the Inspector to a truthful, real-data Observatory surface', async () => {
    const { wrapper, pinia } = await mountStudio()

    expect(wrapper.get('[role="tab"][aria-selected="true"]').text()).toBe('Entity')
    await wrapper.get('[role="tab"]:nth-child(2)').trigger('click')
    expect(wrapper.find('.studio-observatory-panel').text()).toContain('No runtime world available')
    expect(wrapper.find('.inspector-tabs').text()).toContain('Entity')
    expect(wrapper.find('.studio-observatory-panel').text()).not.toContain('guard-001')

    await useGameStore(pinia).send('创建 MarioWorld')
    await nextTick()
    const panel = wrapper.find('.studio-observatory-panel')
    expect(panel.text()).toContain('runtime-world')
    expect(panel.text()).toContain('6')
    expect(panel.text()).toContain('player')
    expect(panel.text()).toContain('terrain')
    expect(panel.text()).toContain('platform')
    expect(panel.text()).toContain('enemy')
    expect(panel.text()).toContain('goal')
    expect(panel.text()).toContain('checkpoint')
    expect(panel.text()).toContain('No trace data available')
    expect(panel.find('a[href="/observatory"]').exists()).toBe(true)

    await wrapper.get('[role="tab"]:first-child').trigger('click')
    expect(wrapper.find('.entity-inspector').exists()).toBe(false)
    expect(wrapper.find('.runtime-summary').exists()).toBe(true)
    wrapper.unmount()
  })

  it('keeps Observatory mode live when RuntimeWorldStore changes', async () => {
    const { wrapper, pinia } = await mountStudio()
    const store = useGameStore(pinia)
    await store.send('创建 MarioWorld')
    await wrapper.get('[role="tab"]:nth-child(2)').trigger('click')

    const world = store.worldStore.getWorld()
    store.worldStore.setWorld({
      entities: world.entities.map((entity) => entity.id === 'player'
        ? { ...entity, x: 123, components: [createPositionComponent(123, 300)] }
        : entity),
    })
    store.markWorldUpdated()
    await nextTick()

    expect(wrapper.find('.studio-observatory-panel').text()).toContain('player')
    expect(useObservatoryDataStore(pinia).viewModel.runtimeView.entities.find(
      (entity) => entity.id === 'player',
    )?.position).toBe(JSON.stringify({ x: 123, y: 300 }))
    wrapper.unmount()
  })

  it('clears selection when the selected entity disappears from the world', async () => {
    const { wrapper } = await mountStudio()
    const store = useGameStore()
    await store.send('创建 MarioWorld')
    await nextTick()
    await wrapper.findAll('.entity-row')[0].trigger('click')

    store.worldStore.setWorld({ entities: [] })
    store.markWorldUpdated()
    await nextTick()

    expect(store.selectedEntityId).toBeNull()
    expect(wrapper.find('.entity-inspector').exists()).toBe(false)
    expect(wrapper.text()).toContain('No runtime world available')

    wrapper.unmount()
  })

  it('retains route compatibility and the shared world across Observatory navigation', async () => {
    const { wrapper, pinia, router } = await mountStudio()
    const store = useGameStore(pinia)
    const worldStore = store.worldStore
    await store.send('创建 MarioWorld')

    await router.push('/observatory')
    await nextTick()
    expect(wrapper.find('.observatory-shell').exists()).toBe(true)
    expect(useObservatoryDataStore(pinia).viewModel.runtimeView.entityCount).toBe(6)
    expect(lifecycle).toMatchObject({
      pixiDestroyed: 1,
      runnerStopped: 1,
      loopStopped: 1,
      inputDetached: 1,
    })

    await router.push('/')
    await nextTick()
    expect(wrapper.find('.genesis-studio-shell').exists()).toBe(true)
    expect(wrapper.findAll('.game-container canvas')).toHaveLength(1)
    expect(useGameStore(pinia).worldStore).toBe(worldStore)
    expect(worldStore.getWorld().entities).toHaveLength(6)
    expect(lifecycle).toMatchObject({
      pixiCreated: 2,
      runnerStarted: 2,
      inputAttached: 2,
    })

    wrapper.unmount()
  })

  it('balances runtime resources across repeated Studio mount and unmount cycles', async () => {
    const first = await mountStudio()
    first.wrapper.unmount()
    const second = await mountStudio()
    second.wrapper.unmount()

    expect(lifecycle).toEqual({
      pixiCreated: 2,
      pixiDestroyed: 2,
      runnerStarted: 2,
      runnerStopped: 2,
      loopStopped: 2,
      inputAttached: 2,
      inputDetached: 2,
      resizeObserverCreated: 2,
      resizeObserverObserved: 2,
      resizeObserverDisconnected: 2,
      resize: 2,
      resizeCallback: expect.any(Function),
    })
  })
})
