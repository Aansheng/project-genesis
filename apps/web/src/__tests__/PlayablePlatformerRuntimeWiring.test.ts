import { describe, expect, it } from 'vitest'
import {
  DefaultCreateWorldPipeline,
  DefaultGameIntentExtractor,
  DefaultIntentRouter,
  DefaultSemanticGameDslBuilder,
  DefaultSemanticWorldGenerator,
} from '@genesis/ai'
import {
  DefaultGroundCollisionSystem,
  DefaultGravitySystem,
  DefaultJumpSystem,
  DefaultPlayerControllerSystem,
  DefaultRuntimeExecutionLoop,
  DefaultRuntimeProjection,
  DefaultRuntimeSystemRegistry,
  DefaultRuntimeWorldStore,
  DefaultVerticalMotionSystem,
} from '@genesis/runtime'
import { KeyboardInputProvider } from '@genesis/renderer'
import { DefaultRuntimeRendererAdapter } from '@genesis/renderer'
import { DefaultRuntimeVisualizationLoop } from '@genesis/renderer'
import type { PixiEntityRenderer, RenderWorldView } from '@genesis/renderer'
import type { RenderWorld } from '@genesis/renderer'

class CaptureRenderer implements PixiEntityRenderer {
  worlds: RenderWorld[] = []
  render(world: RenderWorld): RenderWorldView {
    this.worlds.push(world)
    return { entities: world.entities.map((entity) => ({ id: entity.id, graphics: {} as never })) }
  }
  clear(): void {}
}

function createPlayableRuntime() {
  const pipeline = new DefaultCreateWorldPipeline(
    new DefaultIntentRouter(), new DefaultGameIntentExtractor(),
    new DefaultSemanticWorldGenerator(), new DefaultSemanticGameDslBuilder(),
    new DefaultRuntimeProjection(),
  )
  const world = pipeline.execute({ input: '创建 MarioWorld' }).world
  const store = new DefaultRuntimeWorldStore(world)
  const target = new EventTarget()
  const input = new KeyboardInputProvider(target)
  const registry = new DefaultRuntimeSystemRegistry()
  registry.register(new DefaultPlayerControllerSystem(input, 3))
  registry.register(new DefaultJumpSystem(input, 50))
  registry.register(new DefaultGravitySystem(1))
  registry.register(new DefaultVerticalMotionSystem())
  registry.register(new DefaultGroundCollisionSystem(400))
  const renderer = new CaptureRenderer()
  const loop = new DefaultRuntimeVisualizationLoop(
    new DefaultRuntimeExecutionLoop(registry),
    new DefaultRuntimeRendererAdapter(), renderer, world, store, store,
  )
  return { store, target, input, registry, loop }
}

function playerPosition(store: DefaultRuntimeWorldStore) {
  const player = store.getWorld().entities.find((entity) => entity.type === 'player')!
  return player.components!.find((component) => component.type === 'position')!.properties as { x: number; y: number }
}

describe('WO-S10-010: playable platformer runtime wiring', () => {
  it('registers systems in deterministic execution order', () => {
    const { registry } = createPlayableRuntime()
    expect(registry.getSystems().map((system) => system.name)).toEqual([
      'PlayerControllerSystem', 'JumpSystem', 'GravitySystem', 'VerticalMotionSystem', 'GroundCollisionSystem',
    ])
  })

  it('moves, jumps, falls, and lands on the generated MarioWorld', () => {
    const runtime = createPlayableRuntime()
    runtime.input.attach()
    runtime.loop.start()

    const initial = playerPosition(runtime.store)
    runtime.target.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    runtime.loop.tick()
    expect(playerPosition(runtime.store).x).toBe(initial.x + 3)

    runtime.target.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight' }))
    runtime.target.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
    runtime.loop.tick()
    expect(playerPosition(runtime.store).y).toBeLessThan(initial.y)

    runtime.target.dispatchEvent(new KeyboardEvent('keyup', { key: ' ' }))
    for (let index = 0; index < 300; index++) runtime.loop.tick()
    expect(playerPosition(runtime.store).y).toBe(400)
  })

  it('detaches input cleanly and preserves replacement-world gameplay', () => {
    const runtime = createPlayableRuntime()
    runtime.input.attach()
    runtime.loop.start()
    const replacement = runtime.store.getWorld()
    runtime.store.setWorld(replacement)
    runtime.target.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    runtime.loop.tick()
    expect(playerPosition(runtime.store).x).toBe(77)
    runtime.input.detach()
    expect(runtime.input.isAttached()).toBe(false)
  })
})
