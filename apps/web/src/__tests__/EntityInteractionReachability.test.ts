import { describe, expect, it } from 'vitest'
import {
  DefaultCreateWorldPipeline,
  DefaultGameIntentExtractor,
  DefaultIntentRouter,
  DefaultSemanticGameDslBuilder,
  DefaultSemanticWorldGenerator,
} from '@genesis/ai'
import type { GameWorldModel, World } from '@genesis/shared'
import {
  DefaultRuntimeExecutionLoop,
  DefaultRuntimeProjection,
  DefaultRuntimeSystemRegistry,
  DefaultRuntimeWorldStore,
} from '@genesis/runtime'
import { isPositionComponent } from '@genesis/shared'
import { KeyboardInputProvider } from '@genesis/renderer'
import { registerStudioRuntimeSystems } from '../components/studio/runtimeMotionProfile'

interface ProductionInteractionRuntime {
  readonly semanticWorld: GameWorldModel
  readonly worldType: 'farm' | 'rpg'
  readonly store: DefaultRuntimeWorldStore
  readonly target: EventTarget
  readonly input: KeyboardInputProvider
  readonly loop: DefaultRuntimeExecutionLoop
}

function createPipeline(): DefaultCreateWorldPipeline {
  return new DefaultCreateWorldPipeline(
    new DefaultIntentRouter(),
    new DefaultGameIntentExtractor(),
    new DefaultSemanticWorldGenerator(),
    new DefaultSemanticGameDslBuilder(),
    new DefaultRuntimeProjection(),
  )
}

function createProductionRuntime(input: string, worldType: 'farm' | 'rpg'): ProductionInteractionRuntime {
  const generated = createPipeline().execute({ input })
  const semanticWorld = generated.semanticWorld!
  expect(semanticWorld.worldType).toBe(worldType)
  const target = new EventTarget()
  const inputProvider = new KeyboardInputProvider(target)
  inputProvider.attach()
  const registry = new DefaultRuntimeSystemRegistry()
  registerStudioRuntimeSystems(registry, inputProvider, semanticWorld.worldType)
  const store = new DefaultRuntimeWorldStore(generated.world)
  const loop = new DefaultRuntimeExecutionLoop(registry, undefined, {
    getRuleSet: () => generated.gameplayRuleSet,
    getSemanticRevision: () => generated.gameplayRuleSet?.semanticRevision ?? 0,
    getSemanticWorld: () => semanticWorld,
  })
  return { semanticWorld, worldType, store, target, input: inputProvider, loop }
}

function position(world: World, entityId: string): Readonly<{ x: number; y: number }> {
  const entity = world.entities.find(item => item.id === entityId)
  const component = entity?.components?.find(isPositionComponent)
  if (!component) throw new Error(`Missing Runtime Position for ${entityId}`)
  return component.properties
}

function tick(runtime: ProductionInteractionRuntime) {
  const result = runtime.loop.tickWithResult(runtime.store.getWorld())
  runtime.store.setWorld(result.world)
  return result
}

function settle(runtime: ProductionInteractionRuntime): void {
  for (let index = 0; index < 100; index += 1) tick(runtime)
}

function movePlayerNear(runtime: ProductionInteractionRuntime, targetId: string): void {
  const target = position(runtime.store.getWorld(), targetId)
  const initialPlayer = position(runtime.store.getWorld(), 'player')
  const direction = target.x >= initialPlayer.x ? 'ArrowRight' : 'ArrowLeft'
  runtime.target.dispatchEvent(new KeyboardEvent('keydown', { key: direction, bubbles: true }))
  for (let index = 0; index < 200; index += 1) {
    const player = position(runtime.store.getWorld(), 'player')
    if (Math.abs(target.x - player.x) <= 24) break
    tick(runtime)
  }
  runtime.target.dispatchEvent(new KeyboardEvent('keyup', { key: direction, bubbles: true }))
  tick(runtime)
}

function movePlayerAway(runtime: ProductionInteractionRuntime, targetId: string): void {
  const target = position(runtime.store.getWorld(), targetId)
  const player = position(runtime.store.getWorld(), 'player')
  const direction = target.x >= player.x ? 'ArrowLeft' : 'ArrowRight'
  runtime.target.dispatchEvent(new KeyboardEvent('keydown', { key: direction, bubbles: true }))
  for (let index = 0; index < 60; index += 1) tick(runtime)
  runtime.target.dispatchEvent(new KeyboardEvent('keyup', { key: direction, bubbles: true }))
  tick(runtime)
}

function pressEnter(runtime: ProductionInteractionRuntime) {
  runtime.target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
  const result = tick(runtime)
  runtime.target.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }))
  tick(runtime)
  return result
}

describe('WO-S38-001: generic Player-directed entity interaction reachability', () => {
  it.each([
    ['做一个农场游戏', 'farm', 'farm-interaction', 'npc'] as const,
    ['创建一个 RPG', 'rpg', 'rpg-interaction', 'quest'] as const,
  ])('traverses CreateWorld, normal movement, Enter, targeting, Rule execution, and authoritative result for %s', (input, worldType, ruleId, targetCategory) => {
    const runtime = createProductionRuntime(input, worldType)
    settle(runtime)

    const targetId = runtime.semanticWorld.entities.find(entity => entity.category === targetCategory)?.id
    expect(targetId).toBeDefined()
    movePlayerNear(runtime, targetId!)
    const result = pressEnter(runtime)

    expect(result.gameplayEvents).toContainEqual(expect.objectContaining({
      type: 'ENTITY_INTERACTION_REQUESTED',
      actorEntityId: 'player',
      targetEntityId: targetId,
    }))
    expect(result.gameplayRuleResults).toContainEqual(expect.objectContaining({
      ruleId,
      status: 'executed',
      committed: true,
      actionResults: [expect.objectContaining({
        actionType: 'SET_ENTITY_PROPERTY',
        status: 'executed',
        mutation: {
          type: 'ENTITY_PROPERTY_UPDATED',
          targetEntityId: targetId,
          property: 'activated',
          value: true,
        },
      })],
    }))
    expect(runtime.store.getWorld().entities.find(entity => entity.id === targetId)?.components).toContainEqual({
      type: 'gameplay-state',
      properties: { activated: true },
    })

    movePlayerAway(runtime, targetId!)
    const beforeNoTarget = runtime.store.getWorld()
    const noTarget = pressEnter(runtime)
    expect(noTarget.gameplayEvents).not.toContainEqual(expect.objectContaining({ type: 'ENTITY_INTERACTION_REQUESTED' }))
    expect(noTarget.gameplayRuleResults).toEqual([])
    expect(noTarget.world.entities).toEqual(beforeNoTarget.entities)
    runtime.input.detach()
  })
})
