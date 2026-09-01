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
  isCollisionBoundsComponent,
  isHealthComponent,
  isPositionComponent,
  type Entity,
  type GameWorldModel,
  type World,
} from '@genesis/shared'
import {
  DEFAULT_RUNTIME_PLACEMENT_MINIMUM_DISTANCE,
  DefaultRuntimeExecutionLoop,
  DefaultRuntimeGameplayEventCollector,
  DefaultRuntimeProjection,
  DefaultRuntimeSystemRegistry,
  DefaultRuntimeWorldStore,
} from '@genesis/runtime'
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

function addRuntimeEntity(world: World, entity: Entity): World {
  return Object.freeze({
    entities: Object.freeze([...world.entities, entity]),
  }) as unknown as World
}

function health(world: World, entityId: string): number | undefined {
  return world.entities.find(entity => entity.id === entityId)?.components?.find(isHealthComponent)?.properties.current
}

function position(world: World, entityId: string): Readonly<{ x: number; y: number }> {
  return world.entities.find(entity => entity.id === entityId)!.components!.find(isPositionComponent)!.properties
}

interface RuntimeBounds {
  readonly left: number
  readonly right: number
  readonly top: number
  readonly bottom: number
}

function bounds(world: World, entityId: string): RuntimeBounds {
  const entity = world.entities.find(item => item.id === entityId)!
  const positionComponent = entity.components!.find(isPositionComponent)!
  const collisionBounds = entity.components!.find(isCollisionBoundsComponent)!
  const { x, y } = positionComponent.properties
  const { width, height, offsetX, offsetY } = collisionBounds.properties
  const centerX = x + offsetX
  const centerY = y + offsetY
  return {
    left: centerX - width / 2,
    right: centerX + width / 2,
    top: centerY - height / 2,
    bottom: centerY + height / 2,
  }
}

function overlaps(first: RuntimeBounds, second: RuntimeBounds): boolean {
  return first.left < second.right
    && first.right > second.left
    && first.top < second.bottom
    && first.bottom > second.top
}

interface ProductionRuntime {
  readonly semanticWorld: GameWorldModel
  readonly playerId: string
  readonly enemyId: string
  readonly store: DefaultRuntimeWorldStore
  readonly target: EventTarget
  readonly input: KeyboardInputProvider
  readonly loop: DefaultRuntimeExecutionLoop
}

function createProductionRuntime(enemyDistance = 40): ProductionRuntime {
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
  const rules = generated.gameplayRuleSet!
  const loop = new DefaultRuntimeExecutionLoop(registry, collector, {
    getRuleSet: () => rules,
    getWorldId: () => 'world-1',
    getSessionId: () => 'world-1',
    getSemanticRevision: () => 0,
    getSemanticWorld: () => semanticWorld,
  })
  return { semanticWorld, playerId, enemyId, store, target, input, loop }
}

function tick(runtime: ProductionRuntime): ReturnType<DefaultRuntimeExecutionLoop['tickWithResult']> {
  const result = runtime.loop.tickWithResult(runtime.store.getWorld())
  runtime.store.setWorld(result.world)
  return result
}

function pressSpace(runtime: ProductionRuntime): ReturnType<DefaultRuntimeExecutionLoop['tickWithResult']> {
  runtime.target.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
  const attack = tick(runtime)
  runtime.target.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }))
  tick(runtime)
  return attack
}

function pressSpaceWithFollowUp(runtime: ProductionRuntime): {
  readonly attack: ReturnType<DefaultRuntimeExecutionLoop['tickWithResult']>
  readonly followUp: ReturnType<DefaultRuntimeExecutionLoop['tickWithResult']>
} {
  runtime.target.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
  const attack = tick(runtime)
  runtime.target.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }))
  const followUp = tick(runtime)
  return { attack, followUp }
}

describe('WO-S32-001: generated Survival directed offense production reachability', () => {
  it('routes an explicit non-contact Space press through Runtime target selection and DAMAGE_ENTITY', () => {
    const runtime = createProductionRuntime(40)
    const result = pressSpace(runtime)

    expect(result.gameplayEvents).toContainEqual(expect.objectContaining({
      type: 'ENTITY_ATTACK_REQUESTED',
      actorEntityId: runtime.playerId,
      targetEntityId: runtime.enemyId,
    }))
    expect((result.gameplayEvents ?? []).some(event => event.type === 'ENTITY_CONTACT_STARTED')).toBe(false)
    expect(health(result.world, runtime.enemyId)).toBe(75)
    expect(health(result.world, runtime.playerId)).toBe(100)
    expect(result.gameplayRuleResults?.find(item => item.ruleId === 'survival-player-offense')).toMatchObject({
      status: 'executed',
      committed: true,
      actionResults: [{ actionType: 'DAMAGE_ENTITY', status: 'executed' }],
    })
  })

  it('does nothing on a valid Space edge when no target is within the finite range', () => {
    const runtime = createProductionRuntime(49)
    const before = runtime.store.getWorld()
    const result = pressSpace(runtime)

    expect((result.gameplayEvents ?? []).some(event => event.type === 'ENTITY_ATTACK_REQUESTED')).toBe(false)
    expect(health(result.world, runtime.enemyId)).toBe(health(before, runtime.enemyId))
    expect(health(result.world, runtime.playerId)).toBe(health(before, runtime.playerId))
  })

  it('keeps contact as Enemy-to-Player pressure without automatic Enemy offense', () => {
    const runtime = createProductionRuntime(0)
    const result = tick(runtime)

    expect(result.gameplayEvents).toContainEqual(expect.objectContaining({
      type: 'ENTITY_CONTACT_STARTED',
      actorEntityId: runtime.playerId,
      targetEntityId: runtime.enemyId,
    }))
    expect((result.gameplayEvents ?? []).some(event => event.type === 'ENTITY_ATTACK_REQUESTED')).toBe(false)
    expect(health(result.world, runtime.enemyId)).toBe(100)
    expect(health(result.world, runtime.playerId)).toBe(99)
  })

  it('defeats one Enemy after four explicit attacks, preserves progression, and replenishes it', () => {
    const runtime = createProductionRuntime(40)
    let defeatResult: ReturnType<DefaultRuntimeExecutionLoop['tickWithResult']> | undefined

    for (let attack = 0; attack < 4; attack += 1) {
      defeatResult = pressSpace(runtime)
    }

    expect(defeatResult?.world.entities.some(entity => entity.id === runtime.enemyId)).toBe(false)
    expect(defeatResult?.gameplayRuleResults?.find(item => item.ruleId === 'survival-enemy-defeat')).toMatchObject({
      status: 'executed',
      committed: true,
    })
    expect(defeatResult?.gameplayProgressionState?.values).toMatchObject({ experience: 1, level: 2 })
    expect(runtime.store.getWorld().entities.some(entity => entity.type === 'enemy' && entity.id !== runtime.enemyId)).toBe(true)
  })

  it('can target a replenished Enemy through the same Space path', () => {
    const runtime = createProductionRuntime(40)
    for (let attack = 0; attack < 4; attack += 1) pressSpace(runtime)

    const replacement = runtime.store.getWorld().entities.find(entity => entity.type === 'enemy' && entity.id !== runtime.enemyId)!
    const playerPosition = position(runtime.store.getWorld(), runtime.playerId)
    runtime.store.setWorld(replacePosition(
      runtime.store.getWorld(),
      replacement.id,
      playerPosition.x + 40,
      playerPosition.y,
    ))
    const result = pressSpace(runtime)

    expect(result.gameplayEvents).toContainEqual(expect.objectContaining({
      type: 'ENTITY_ATTACK_REQUESTED',
      targetEntityId: replacement.id,
    }))
    expect(health(result.world, replacement.id)).toBe(75)
  })

  it('selects exactly one nearest target from multiple Runtime Enemies', () => {
    const runtime = createProductionRuntime(40)
    const originalEnemy = runtime.store.getWorld().entities.find(entity => entity.id === runtime.enemyId)!
    const playerPosition = position(runtime.store.getWorld(), runtime.playerId)
    const secondEnemy = Object.freeze({
      ...originalEnemy,
      id: 'enemy-2',
      x: playerPosition.x + 30,
      y: playerPosition.y,
      components: Object.freeze(originalEnemy.components!.map(component =>
        isPositionComponent(component)
          ? createPositionComponent(playerPosition.x + 30, playerPosition.y)
          : component,
      )),
    }) as unknown as Entity
    runtime.store.setWorld(addRuntimeEntity(runtime.store.getWorld(), secondEnemy))
    const result = pressSpace(runtime)

    expect(result.gameplayEvents).toContainEqual(expect.objectContaining({
      type: 'ENTITY_ATTACK_REQUESTED',
      targetEntityId: 'enemy-2',
    }))
    expect(health(result.world, 'enemy-2')).toBe(75)
    expect(health(result.world, runtime.enemyId)).toBe(100)
    expect(result.gameplayRuleResults?.filter(item => item.ruleId === 'survival-player-offense')).toHaveLength(1)
  })

  it('keeps two Runtime replacement cycles separated from the current Player', () => {
    const runtime = createProductionRuntime(40)
    for (let attack = 0; attack < 3; attack += 1) pressSpace(runtime)
    const firstDefeat = pressSpaceWithFollowUp(runtime).followUp

    const firstReplacement = firstDefeat.world.entities.find(
      entity => entity.type === 'enemy' && entity.id !== runtime.enemyId,
    )!
    const firstPlayerPosition = position(firstDefeat.world, runtime.playerId)
    const firstReplacementPosition = position(firstDefeat.world, firstReplacement.id)
    expect(Math.hypot(
      firstReplacementPosition.x - firstPlayerPosition.x,
      firstReplacementPosition.y - firstPlayerPosition.y,
    )).toBeGreaterThanOrEqual(DEFAULT_RUNTIME_PLACEMENT_MINIMUM_DISTANCE)
    expect(overlaps(
      bounds(firstDefeat.world, firstReplacement.id),
      bounds(firstDefeat.world, runtime.playerId),
    )).toBe(false)

    const movedPlayerWorld = replacePosition(
      replacePosition(runtime.store.getWorld(), runtime.playerId, 400, 240),
      firstReplacement.id,
      440,
      240,
    )
    runtime.store.setWorld(movedPlayerWorld)

    for (let attack = 0; attack < 3; attack += 1) pressSpace(runtime)
    const secondDefeat = pressSpaceWithFollowUp(runtime).followUp
    const secondReplacement = secondDefeat.world.entities.find(
      entity => entity.type === 'enemy' && entity.id !== firstReplacement.id,
    )!
    const secondPlayerPosition = position(secondDefeat.world, runtime.playerId)
    const secondReplacementPosition = position(secondDefeat.world, secondReplacement.id)
    const spawnDistance = Math.hypot(
      secondReplacementPosition.x - secondPlayerPosition.x,
      secondReplacementPosition.y - secondPlayerPosition.y,
    )

    expect(spawnDistance).toBeGreaterThanOrEqual(DEFAULT_RUNTIME_PLACEMENT_MINIMUM_DISTANCE)
    expect(overlaps(
      bounds(secondDefeat.world, secondReplacement.id),
      bounds(secondDefeat.world, runtime.playerId),
    )).toBe(false)
    expect(secondReplacementPosition).not.toEqual(firstReplacementPosition)

    const pursued = tick(runtime)
    const pursuedPosition = position(pursued.world, secondReplacement.id)
    expect(Math.hypot(
      pursuedPosition.x - secondPlayerPosition.x,
      pursuedPosition.y - secondPlayerPosition.y,
    )).toBeLessThan(spawnDistance)

    runtime.input.detach()
  })
})
