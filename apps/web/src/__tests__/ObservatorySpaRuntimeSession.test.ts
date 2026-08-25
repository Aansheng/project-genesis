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

async function mountSession(path = '/') {
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

describe('Observatory SPA runtime session integration', () => {
  it('keeps the same RuntimeWorldStore and Mario world across both routes', async () => {
    const { wrapper, pinia, router } = await mountSession()
    const gameStore = useGameStore(pinia)
    const worldStore = gameStore.worldStore

    await gameStore.send('创建 MarioWorld')
    const marioWorld = worldStore.getWorld()
    const expectedIds = marioWorld.entities.map((entity) => entity.id)
    const player = marioWorld.entities.find((entity) => entity.type === 'player')
    const playerPosition = player?.components?.find(
      (component) => component.type === 'position',
    )

    expect(marioWorld.entities).toHaveLength(7)
    expect(player).toBeDefined()
    expect(playerPosition?.properties).toMatchObject({ x: 80, y: 300 })
    expect(wrapper.get('a[href="/observatory"]')).toBeTruthy()

    await router.push('/observatory')
    await nextTick()

    const observatoryData = useObservatoryDataStore(pinia)
    expect(useGameStore(pinia).worldStore).toBe(worldStore)
    expect(worldStore.getWorld()).toBe(marioWorld)
    expect(observatoryData.viewModel.runtimeView.entityCount).toBe(7)
    expect(observatoryData.viewModel.runtimeView.entities.map((entity) => entity.id)).toEqual(
      expectedIds,
    )
    expect(observatoryData.viewModel.runtimeView.entities.some((entity) =>
      entity.id.includes('farm'),
    )).toBe(false)
    expect(observatoryData.viewModel.runtimeView.entities.find((entity) =>
      entity.type === 'player',
    )?.position).toBe(JSON.stringify({ x: 80, y: 300 }))
    expect(wrapper.get('a[href="/"]')).toBeTruthy()

    await router.push('/')
    await nextTick()
    expect(useGameStore(pinia).worldStore).toBe(worldStore)
    expect(worldStore.getWorld()).toBe(marioWorld)
    expect(wrapper.find('.game-container canvas').exists()).toBe(true)

    wrapper.unmount()
  })

  it('synchronizes replacements and repeated route switches without resetting state', async () => {
    const { wrapper, pinia, router } = await mountSession()
    const gameStore = useGameStore(pinia)
    const worldStore = gameStore.worldStore

    await gameStore.send('create farm world')
    const replacement = worldStore.getWorld()
    const replacementIds = replacement.entities.map((entity) => entity.id)

    await router.push('/observatory')
    await nextTick()
    expect(useObservatoryDataStore(pinia).viewModel.runtimeView.entities.map(
      (entity) => entity.id,
    )).toEqual(replacementIds)

    await router.push('/')
    await nextTick()
    await router.push('/observatory')
    await nextTick()

    expect(useGameStore(pinia).worldStore).toBe(worldStore)
    expect(worldStore.getWorld()).toBe(replacement)
    expect(useObservatoryDataStore(pinia).viewModel.runtimeView.entities.map(
      (entity) => entity.id,
    )).toEqual(replacementIds)
    wrapper.unmount()
  })

  it('tears down and safely remounts one Pixi/input/RAF stack per game visit', async () => {
    const { wrapper, router } = await mountSession()
    expect(lifecycle).toMatchObject({
      pixiCreated: 1,
      runnerStarted: 1,
      inputAttached: 1,
    })

    await router.push('/observatory')
    await nextTick()
    expect(lifecycle).toMatchObject({
      pixiDestroyed: 1,
      runnerStopped: 1,
      loopStopped: 1,
      inputDetached: 1,
    })

    await router.push('/')
    await nextTick()
    expect(lifecycle).toMatchObject({
      pixiCreated: 2,
      runnerStarted: 2,
      inputAttached: 2,
      pixiDestroyed: 1,
      runnerStopped: 1,
      inputDetached: 1,
    })

    await router.push('/observatory')
    await nextTick()
    expect(lifecycle).toMatchObject({
      pixiDestroyed: 2,
      runnerStopped: 2,
      loopStopped: 2,
      inputDetached: 2,
    })
    wrapper.unmount()
  })

  it('shows an honestly empty Observatory on a direct empty-session route', async () => {
    const { wrapper, pinia } = await mountSession('/observatory')
    const gameStore = useGameStore(pinia)
    const observatoryData = useObservatoryDataStore(pinia)

    expect(gameStore.worldStore.getWorld().entities).toHaveLength(0)
    expect(observatoryData.viewModel.runtimeView.entityCount).toBe(0)
    expect(observatoryData.viewModel.runtimeView.entities).toEqual([])
    expect(lifecycle.pixiCreated).toBe(0)
    expect(lifecycle.runnerStarted).toBe(0)
    wrapper.unmount()
  })
})
