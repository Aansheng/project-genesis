import { describe, expect, it } from 'vitest'
import {
  DefaultCreateWorldPipeline,
  DefaultGameIntentExtractor,
  DefaultIntentRouter,
  DefaultSemanticGameDslBuilder,
  DefaultSemanticWorldGenerator,
} from '@genesis/ai'
import {
  DefaultRuntimeExecutionLoop,
  DefaultRuntimeProjection,
  DefaultRuntimeSystemRegistry,
  DefaultRuntimeWorldStore,
} from '@genesis/runtime'
import { KeyboardInputProvider } from '@genesis/renderer'
import { registerStudioRuntimeSystems, resolveStudioMotionProfile } from '../components/studio/runtimeMotionProfile'

function createSurvivalRuntime() {
  const pipeline = new DefaultCreateWorldPipeline(
    new DefaultIntentRouter(),
    new DefaultGameIntentExtractor(),
    new DefaultSemanticWorldGenerator(),
    new DefaultSemanticGameDslBuilder(),
    new DefaultRuntimeProjection(),
  )
  const world = pipeline.execute({ input: '帮我生成一个2D幸存者游戏' }).world
  const store = new DefaultRuntimeWorldStore(world)
  const target = new EventTarget()
  const input = new KeyboardInputProvider(target)
  const registry = new DefaultRuntimeSystemRegistry()
  registerStudioRuntimeSystems(registry, input, 'survival')
  return { store, target, input, registry, loop: new DefaultRuntimeExecutionLoop(registry) }
}

function playerPosition(store: DefaultRuntimeWorldStore) {
  const player = store.getWorld().entities.find((entity) => entity.type === 'player')!
  return player.components!.find((component) => component.type === 'position')!.properties as { x: number, y: number }
}

describe('WO-S26-002: WorldType-selected generic motion profile', () => {
  it('selects top-down only for survival and preserves platformer fallback', () => {
    expect(resolveStudioMotionProfile('survival')).toBe('top-down')
    expect(resolveStudioMotionProfile('platformer')).toBe('platformer')
    expect(resolveStudioMotionProfile(undefined)).toBe('platformer')
  })

  it('omits platformer-only systems from the survival registry', () => {
    const runtime = createSurvivalRuntime()

    expect(runtime.registry.getSystems().map((system) => system.name)).toEqual([
      'PlayerControllerSystem',
      'VerticalMotionSystem',
      'EntityContactSystem',
    ])
  })

  it('moves the generated survival Player in two directions without gravity or ground clamp', () => {
    const runtime = createSurvivalRuntime()
    runtime.input.attach()

    const initial = playerPosition(runtime.store)
    runtime.target.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    runtime.store.setWorld(runtime.loop.tick(runtime.store.getWorld()))
    runtime.target.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' }))
    expect(playerPosition(runtime.store)).toEqual({ x: initial.x + 3, y: initial.y })

    runtime.target.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
    runtime.store.setWorld(runtime.loop.tick(runtime.store.getWorld()))
    runtime.target.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' }))
    expect(playerPosition(runtime.store)).toEqual({ x: initial.x + 3, y: initial.y - 3 })

    runtime.input.detach()
  })

  it('retains the established platformer system set', () => {
    const registry = new DefaultRuntimeSystemRegistry()
    const input = new KeyboardInputProvider(new EventTarget())
    registerStudioRuntimeSystems(registry, input, 'platformer')

    expect(registry.getSystems().map((system) => system.name)).toEqual([
      'PlayerControllerSystem',
      'JumpSystem',
      'GravitySystem',
      'VerticalMotionSystem',
      'GroundCollisionSystem',
      'EntityContactSystem',
    ])
  })
})
