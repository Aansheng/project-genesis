import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createMemoryHistory } from 'vue-router'
import { nextTick } from 'vue'
import App from '../App.vue'
import { createAppRouter } from '../router'
import { useGameStore } from '../stores/gameStore'
import { useObservatoryDataStore } from '../stores/observatoryData'

const lifecycle = vi.hoisted(() => ({
  pixiCreated: 0,
  pixiDestroyed: 0,
  runnerStarted: 0,
  runnerStopped: 0,
  loopStopped: 0,
  inputAttached: 0,
  inputDetached: 0,
}))

vi.mock('pixi.js', () => ({
  Application: class {
    readonly view = document.createElement('canvas')
    readonly stage = { addChild: vi.fn() }

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
  Object.keys(lifecycle).forEach((key) => {
    lifecycle[key as keyof typeof lifecycle] = 0
  })
  document.body.className = ''
})

describe('Genesis Studio Shell Foundation', () => {
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

  it('creates MarioWorld through the command bar and updates every real surface', async () => {
    const { wrapper, pinia } = await mountStudio()
    const store = useGameStore(pinia)
    const worldStore = store.worldStore

    await wrapper.get('#studio-command-input').setValue('创建 MarioWorld')
    await wrapper.get('.studio-command-bar form').trigger('submit')
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

    expect(world.entities).toHaveLength(6)
    expect(wrapper.findAll('.world-explorer-panel .entity-row')).toHaveLength(6)
    expectedIds.forEach((id) => {
      expect(wrapper.find('.world-explorer-panel').text()).toContain(id)
      expect(wrapper.find('.inspector-panel').text()).toContain(id)
    })
    expect(wrapper.find('.entity-count').text()).toBe('6 entities')
    expect(wrapper.find('.runtime-summary').text()).toContain('6')
    expect(wrapper.find('.command-activity').text()).toContain(
      'Created world with 6 entities',
    )
    expect(useObservatoryDataStore(pinia).viewModel.runtimeView.entityCount).toBe(6)
    expect(useGameStore(pinia).worldStore).toBe(worldStore)

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
    })
  })
})
