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
  type World,
} from '@genesis/shared'
import {
  DefaultRuntimeExecutionLoop,
  DefaultRuntimeProjection,
  DefaultRuntimeSystemRegistry,
} from '@genesis/runtime'
import { KeyboardInputProvider } from '@genesis/renderer'
import { registerStudioRuntimeSystems } from '../components/studio/runtimeMotionProfile'

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

describe('WO-S29-001: generated Survival offense production reachability', () => {
  it('runs generated contact offense through the Studio Runtime composition to defeat an Enemy and progress', () => {
    const pipeline = new DefaultCreateWorldPipeline(
      new DefaultIntentRouter(),
      new DefaultGameIntentExtractor(),
      new DefaultSemanticWorldGenerator(),
      new DefaultSemanticGameDslBuilder(),
      new DefaultRuntimeProjection(),
    )
    const generated = pipeline.execute({ input: '生成一个幸存者游戏' })
    const semanticWorld = generated.semanticWorld!
    const rules = generated.gameplayRuleSet!
    const playerId = semanticWorld.entities.find(entity => entity.category === 'player')!.id
    const enemyId = semanticWorld.entities.find(entity => entity.category === 'enemy')!.id
    const registry = new DefaultRuntimeSystemRegistry()
    registerStudioRuntimeSystems(registry, new KeyboardInputProvider(new EventTarget()), 'survival')
    const loop = new DefaultRuntimeExecutionLoop(registry, undefined, {
      getRuleSet: () => rules,
      getWorldId: () => 'world-1',
      getSessionId: () => 'world-1',
      getSemanticRevision: () => 0,
      getSemanticWorld: () => semanticWorld,
    })

    const playerPosition = generated.world.entities
      .find(entity => entity.id === playerId)!
      .components!.find(isPositionComponent)!.properties
    let world = generated.world
    let finalResult: ReturnType<typeof loop.tickWithResult> | undefined
    for (let contact = 0; contact < 4; contact += 1) {
      world = replacePosition(world, enemyId, playerPosition.x + 1, playerPosition.y)
      finalResult = loop.tickWithResult(world)
      world = finalResult.world
      if (contact < 3) expect(health(world, enemyId)).toBe(75 - contact * 25)
    }

    expect(world.entities.some(entity => entity.id === enemyId)).toBe(false)
    expect(finalResult?.gameplayRuleResults?.find(result => result.ruleId === 'survival-enemy-defeat')).toMatchObject({
      status: 'executed',
      committed: true,
    })
    expect(finalResult?.gameplayProgressionState?.values).toMatchObject({ experience: 1, level: 2 })
    expect(finalResult?.gameplaySessionState?.status).toBe('active')
  })
})
