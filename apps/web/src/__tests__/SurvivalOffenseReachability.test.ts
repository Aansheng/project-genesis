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
  DefaultRuntimeWorldStore,
} from '@genesis/runtime'
import { DefaultRuntimeRendererAdapter, KeyboardInputProvider } from '@genesis/renderer'
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

describe('WO-S30-001: generated Survival replenishment production reachability', () => {
  it('defeats an Enemy, replenishes it, and preserves pressure/offense through the Studio Runtime composition', () => {
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
    let worldBeforeDefeat = generated.world
    let finalResult: ReturnType<typeof loop.tickWithResult> | undefined
    for (let contact = 0; contact < 4; contact += 1) {
      if (contact === 3) worldBeforeDefeat = world
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

    const worldStore = new DefaultRuntimeWorldStore(worldBeforeDefeat, loop.gameplayEventCollector)
    worldStore.setWorld(world)
    const replenishment = loop.tickWithResult(worldStore.getWorld())
    const replacement = replenishment.world.entities.find(entity =>
      entity.type === 'enemy' && entity.id !== enemyId,
    )

    expect(replenishment.gameplayEvents).toContainEqual(expect.objectContaining({
      type: 'ENTITY_REMOVED',
      targetEntityId: enemyId,
      payload: expect.objectContaining({ entityType: 'enemy', health: 0 }),
    }))
    expect(replenishment.gameplayRuleResults?.find(result => result.ruleId === 'survival-enemy-replenishment')).toMatchObject({
      status: 'executed',
      committed: true,
      actionResults: [{ actionType: 'SPAWN_ENTITY', status: 'executed' }],
    })
    expect(replacement?.components?.map(component => component.type)).toEqual(expect.arrayContaining([
      'semantic',
      'position',
      'health',
      'collision-bounds',
      'target-directed-movement',
    ]))
    expect(replacement?.components?.find(component => component.type === 'target-directed-movement')?.properties)
      .toMatchObject({ targetEntityId: playerId })
    expect(health(replenishment.world, replacement!.id)).toBe(100)

    const replacementPosition = replacement!.components!.find(isPositionComponent)!.properties
    const playerHealthBeforeReplacement = health(replenishment.world, playerId)!
    const pressureWorld = replacePosition(replenishment.world, replacement!.id, playerPosition.x + 1, playerPosition.y)
    const replacementContact = loop.tickWithResult(pressureWorld)
    expect(health(replacementContact.world, replacement!.id)).toBe(75)
    expect(health(replacementContact.world, playerId)).toBe(playerHealthBeforeReplacement - 1)
    expect(replacementPosition).not.toEqual(playerPosition)

    const renderWorld = new DefaultRuntimeRendererAdapter({ getWorldSpatialMode: () => 'top-down' })
      .adapt(replenishment.world)
    expect(renderWorld.entities.find(entity => entity.id === replacement!.id)).toMatchObject({
      id: replacement!.id,
      type: 'enemy',
      position: replacementPosition,
    })
  })
})
