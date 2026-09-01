import { describe, expect, it } from 'vitest'
import {
  DefaultCreateWorldPipeline,
  DefaultGameIntentExtractor,
  DefaultIntentRouter,
  DefaultSemanticGameDslBuilder,
  DefaultSemanticWorldGenerator,
} from '@genesis/ai'
import {
  createPositionComponent,
  isHealthComponent,
  isPositionComponent,
  type Entity,
  type GameWorldModel,
  type World,
} from '@genesis/shared'
import {
  DefaultRuntimeExecutionLoop,
  DefaultRuntimeGameplayEventCollector,
  DefaultRuntimeProjection,
  DefaultRuntimeSystemRegistry,
  DefaultRuntimeWorldStore,
} from '@genesis/runtime'
import {
  DefaultRuntimeRendererAdapter,
  DefaultRuntimeVisualizationLoop,
  type GameplayOutcomeFeedback,
  type PixiEntityRenderer,
} from '@genesis/renderer'
import type { RenderWorldView } from '@genesis/renderer'
import { KeyboardInputProvider } from '@genesis/renderer'
import { registerStudioRuntimeSystems } from '../components/studio/runtimeMotionProfile'

function createPipeline() {
  return new DefaultCreateWorldPipeline(
    new DefaultIntentRouter(),
    new DefaultGameIntentExtractor(),
    new DefaultSemanticWorldGenerator(),
    new DefaultSemanticGameDslBuilder(),
    new DefaultRuntimeProjection(),
  )
}

function replacePosition(world: World, entityId: string, x: number, y: number): World {
  return Object.freeze({
    entities: Object.freeze(world.entities.map(entity => {
      if (entity.id !== entityId) return entity
      const components = [...(entity.components ?? [])]
      const positionIndex = components.findIndex(isPositionComponent)
      components[positionIndex] = createPositionComponent(x, y)
      return Object.freeze({ ...entity, x, y, components: Object.freeze(components) }) as unknown as Entity
    })),
  }) as unknown as World
}

function health(world: World, entityId: string): number | undefined {
  return world.entities.find(entity => entity.id === entityId)?.components?.find(isHealthComponent)?.properties.current
}

function position(world: World, entityId: string): Readonly<{ x: number; y: number }> {
  return world.entities.find(entity => entity.id === entityId)!.components!.find(isPositionComponent)!.properties
}

interface ProductionFeedbackRuntime {
  readonly semanticWorld: GameWorldModel
  readonly enemyId: string
  readonly store: DefaultRuntimeWorldStore
  readonly target: EventTarget
  readonly input: KeyboardInputProvider
  readonly visualizationLoop: DefaultRuntimeVisualizationLoop
  readonly feedback: GameplayOutcomeFeedback[][]
}

function createProductionRuntime(enemyDistance: number): ProductionFeedbackRuntime {
  const generated = createPipeline().execute({ input: '生成一个幸存者游戏' })
  const semanticWorld = generated.semanticWorld!
  const playerId = semanticWorld.entities.find(entity => entity.category === 'player')!.id
  const enemyId = semanticWorld.entities.find(entity => entity.category === 'enemy')!.id
  const playerPosition = position(generated.world, playerId)
  const initialWorld = replacePosition(
    generated.world,
    enemyId,
    playerPosition.x + enemyDistance,
    playerPosition.y,
  )
  const collector = new DefaultRuntimeGameplayEventCollector('world-1')
  const store = new DefaultRuntimeWorldStore(initialWorld, collector)
  const target = new EventTarget()
  const input = new KeyboardInputProvider(target)
  input.attach()
  const registry = new DefaultRuntimeSystemRegistry()
  registerStudioRuntimeSystems(registry, input, 'survival')
  const loop = new DefaultRuntimeExecutionLoop(registry, collector, {
    getRuleSet: () => generated.gameplayRuleSet!,
    getWorldId: () => 'world-1',
    getSessionId: () => 'world-1',
    getSemanticRevision: () => 0,
    getSemanticWorld: () => semanticWorld,
  })
  const feedback: GameplayOutcomeFeedback[][] = []
  const renderer: PixiEntityRenderer = {
    render: (): RenderWorldView => Object.freeze({ entities: Object.freeze([]) }),
    clear: () => {},
    presentGameplayOutcomes: outcomes => feedback.push([...outcomes]),
  }
  const visualizationLoop = new DefaultRuntimeVisualizationLoop(
    loop,
    new DefaultRuntimeRendererAdapter(),
    renderer,
    initialWorld,
    { getWorld: () => store.getWorld() },
    { setWorld: world => store.setWorld(world) },
  )
  visualizationLoop.start()

  return { semanticWorld, enemyId, store, target, input, visualizationLoop, feedback }
}

function pressSpace(runtime: ProductionFeedbackRuntime): void {
  runtime.target.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
  runtime.visualizationLoop.tick()
  runtime.target.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }))
  runtime.visualizationLoop.tick()
}

function outcomes(runtime: ProductionFeedbackRuntime): GameplayOutcomeFeedback[] {
  return runtime.feedback.flat()
}

describe('WO-S33-001: Survival outcome feedback production reachability', () => {
  it('projects a hit only after the real Space → Runtime damage path commits', () => {
    const runtime = createProductionRuntime(40)
    pressSpace(runtime)

    expect(health(runtime.store.getWorld(), runtime.enemyId)).toBe(75)
    const hit = outcomes(runtime)[0]
    expect(hit).toEqual(expect.objectContaining({
      kind: 'hit',
      entityId: runtime.enemyId,
      damageAmount: 25,
    }))
    expect(hit.position).toMatchObject({ y: 300 })
    expect(hit.position.x).toBeGreaterThan(100)
    expect(hit.position.x).toBeLessThan(120)

    runtime.input.detach()
  })

  it('does not create a successful-hit cue when Space has no valid target', () => {
    const runtime = createProductionRuntime(49)
    pressSpace(runtime)

    expect(health(runtime.store.getWorld(), runtime.enemyId)).toBe(100)
    expect(outcomes(runtime)).toEqual([])

    runtime.input.detach()
  })

  it('projects hit, defeat, replacement arrival, and replacement hit through one active session', () => {
    const runtime = createProductionRuntime(40)
    for (let attack = 0; attack < 4; attack += 1) pressSpace(runtime)

    const replacement = runtime.store.getWorld().entities.find(
      entity => entity.type === 'enemy' && entity.id !== runtime.enemyId,
    )!
    const allOutcomes = outcomes(runtime)

    expect(allOutcomes.filter(item => item.kind === 'hit' && item.entityId === runtime.enemyId)).toHaveLength(4)
    const originalHits = allOutcomes.filter(item => item.kind === 'hit' && item.entityId === runtime.enemyId)
    const defeat = allOutcomes.find(item => item.kind === 'defeat' && item.entityId === runtime.enemyId)!

    expect(allOutcomes).toContainEqual(expect.objectContaining({
      kind: 'defeat',
      entityId: runtime.enemyId,
    }))
    expect(defeat.position).toEqual(originalHits[originalHits.length - 1].position)
    expect(allOutcomes).toContainEqual(expect.objectContaining({
      kind: 'spawn',
      entityId: replacement.id,
    }))

    const player = runtime.store.getWorld().entities.find(entity => entity.type === 'player')!
    const playerPosition = position(runtime.store.getWorld(), player.id)
    runtime.store.setWorld(replacePosition(
      runtime.store.getWorld(),
      replacement.id,
      playerPosition.x + 40,
      playerPosition.y,
    ))
    pressSpace(runtime)

    expect(health(runtime.store.getWorld(), replacement.id)).toBe(50)
    const replacementHit = outcomes(runtime).find(item => item.kind === 'hit' && item.entityId === replacement.id)!
    expect(replacementHit).toEqual(expect.objectContaining({
      kind: 'hit',
      entityId: replacement.id,
      damageAmount: 50,
    }))
    expect(replacementHit.position).toMatchObject({ y: playerPosition.y })
    expect(replacementHit.position.x).toBeGreaterThan(playerPosition.x)
    expect(replacementHit.position.x).toBeLessThanOrEqual(playerPosition.x + 40)
    expect(runtime.store.getWorld().entities.some(entity => entity.id === runtime.enemyId)).toBe(false)

    runtime.input.detach()
  })
})
