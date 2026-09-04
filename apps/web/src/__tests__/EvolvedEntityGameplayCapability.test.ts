import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { DefaultRuntimeExecutionLoop, DefaultRuntimeSystemRegistry } from '@genesis/runtime'
import { isPositionComponent } from '@genesis/shared'
import { KeyboardInputProvider } from '@genesis/renderer'
import { useGameStore } from '../stores/gameStore'
import { registerStudioRuntimeSystems } from '../components/studio/runtimeMotionProfile'

interface StudioGameplayRuntime {
  readonly target: EventTarget
  readonly input: KeyboardInputProvider
  readonly loop: DefaultRuntimeExecutionLoop
}

function offlineGateway(): typeof fetch {
  return vi.fn(async () => {
    throw new Error('offline')
  }) as typeof fetch
}

function position(game: ReturnType<typeof useGameStore>, entityId: string): Readonly<{ x: number; y: number }> {
  const entity = game.worldStore.getWorld().entities.find(item => item.id === entityId)
  const component = entity?.components?.find(isPositionComponent)
  if (!component) throw new Error(`Missing Runtime Position for ${entityId}`)
  return component.properties
}

function createStudioGameplayRuntime(game: ReturnType<typeof useGameStore>): StudioGameplayRuntime {
  const target = new EventTarget()
  const input = new KeyboardInputProvider(target)
  input.attach()
  const registry = new DefaultRuntimeSystemRegistry()
  registerStudioRuntimeSystems(registry, input, game.semanticWorld?.worldType)
  const loop = new DefaultRuntimeExecutionLoop(registry, game.gameplayEventCollector, {
    getRuleSet: () => game.gameplayRuleSet,
    getWorldId: () => game.currentWorldId || undefined,
    getSessionId: () => game.currentWorldId || undefined,
    getSemanticRevision: () => game.semanticRevision,
    getSemanticWorld: () => game.semanticWorld ?? undefined,
  })
  return { target, input, loop }
}

function tick(game: ReturnType<typeof useGameStore>, runtime: StudioGameplayRuntime) {
  const result = runtime.loop.tickWithResult(game.worldStore.getWorld())
  game.worldStore.setWorld(result.world)
  return result
}

function settle(game: ReturnType<typeof useGameStore>, runtime: StudioGameplayRuntime): void {
  for (let index = 0; index < 100; index += 1) tick(game, runtime)
}

function movePlayerNear(
  game: ReturnType<typeof useGameStore>,
  runtime: StudioGameplayRuntime,
  targetId: string,
): void {
  const target = position(game, targetId)
  const initialPlayer = position(game, 'player')
  const direction = target.x >= initialPlayer.x ? 'ArrowRight' : 'ArrowLeft'
  runtime.target.dispatchEvent(new KeyboardEvent('keydown', { key: direction, bubbles: true }))
  for (let index = 0; index < 300; index += 1) {
    const player = position(game, 'player')
    if (Math.abs(target.x - player.x) <= 24) break
    tick(game, runtime)
  }
  runtime.target.dispatchEvent(new KeyboardEvent('keyup', { key: direction, bubbles: true }))
  tick(game, runtime)
}

function pressEnter(game: ReturnType<typeof useGameStore>, runtime: StudioGameplayRuntime) {
  runtime.target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
  const result = tick(game, runtime)
  runtime.target.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }))
  tick(game, runtime)
  return result
}

function gameplayState(game: ReturnType<typeof useGameStore>, entityId: string): Record<string, unknown> {
  const component = game.worldStore.getWorld().entities
    .find(entity => entity.id === entityId)
    ?.components?.find(item => item.type === 'gameplay-state')
  return component?.properties ?? {}
}

describe('WO-S42-001: evolved RPG entity gameplay capability binding', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', offlineGateway())
  })

  it('keeps quest acceptance state, binds an evolved Quest objective, and commits its consequence through Studio Runtime', async () => {
    const game = useGameStore()
    const initial = await game.send('创建一个 RPG')
    expect(initial.success).toBe(true)
    expect(game.semanticWorld?.worldType).toBe('rpg')

    const worldId = game.currentWorldId
    const runtime = createStudioGameplayRuntime(game)
    settle(game, runtime)
    movePlayerNear(game, runtime, 'quest-giver')
    const accepted = pressEnter(game, runtime)
    expect(accepted.gameplayRuleResults).toContainEqual(expect.objectContaining({
      ruleId: 'rpg-interaction',
      status: 'executed',
      committed: true,
    }))
    expect(gameplayState(game, 'quest-giver')).toEqual(expect.objectContaining({
      activated: true,
      questAccepted: true,
    }))

    const evolved = await game.send('再加一个任务')
    expect(evolved.success).toBe(true)
    if (evolved.evolutionPlan?.status !== 'validated') throw new Error('expected a validated world evolution plan')
    expect(game.currentWorldId).toBe(worldId)
    expect(game.semanticRevision).toBe(1)
    expect(game.semanticWorld?.entities).toContainEqual({ id: 'quest-1', category: 'quest', name: 'Quest' })
    expect(game.worldStore.getWorld().entities.map(entity => entity.id)).toContain('quest-1')
    expect(game.worldStore.getWorld().entities.find(entity => entity.id === 'quest-1')?.components).toContainEqual(expect.objectContaining({
      type: 'semantic',
      properties: expect.objectContaining({ category: 'quest', name: 'Quest', gameplayRole: 'quest-objective' }),
    }))
    expect(evolved.evolutionPlan.gameplayReconciliation?.status).toBe('reconciled')
    expect(game.gameplayRuleSet?.bindingStatus).toBe('current')
    expect(game.gameplayRuleSet?.rules).toContainEqual(expect.objectContaining({
      ruleId: 'rpg-complete-main-quest',
      conditions: expect.arrayContaining([
        expect.objectContaining({ type: 'ENTITY_GAMEPLAY_ROLE_EQUALS', role: 'quest-objective' }),
      ]),
    }))
    expect(gameplayState(game, 'quest-giver')).toEqual(expect.objectContaining({ questAccepted: true }))

    movePlayerNear(game, runtime, 'quest-1')
    const completed = pressEnter(game, runtime)
    expect(completed.gameplayEvents).toContainEqual(expect.objectContaining({
      type: 'ENTITY_INTERACTION_REQUESTED',
      actorEntityId: 'player',
      targetEntityId: 'quest-1',
    }))
    expect(completed.gameplayRuleResults).toContainEqual(expect.objectContaining({
      ruleId: 'rpg-complete-main-quest',
      status: 'executed',
      committed: true,
      conditionResult: expect.objectContaining({
        conditions: expect.arrayContaining([
          expect.objectContaining({ type: 'ENTITY_GAMEPLAY_ROLE_EQUALS', status: 'passed' }),
        ]),
      }),
      actionResults: expect.arrayContaining([
        expect.objectContaining({
          mutation: expect.objectContaining({
            type: 'ENTITY_PROPERTY_UPDATED',
            targetEntityId: 'quest-1',
            property: 'questCompleted',
            value: true,
          }),
        }),
      ]),
    }))
    expect(gameplayState(game, 'quest-1')).toEqual(expect.objectContaining({ questCompleted: true }))
    expect(gameplayState(game, 'quest-giver')).toEqual(expect.objectContaining({ questAccepted: true }))

    const repeated = pressEnter(game, runtime)
    expect(repeated.gameplayRuleResults).toContainEqual(expect.objectContaining({
      ruleId: 'rpg-complete-main-quest',
      status: 'executed',
      committed: false,
      actionResults: expect.arrayContaining([
        expect.objectContaining({ actionType: 'SET_ENTITY_PROPERTY', status: 'no_op' }),
      ]),
    }))
    runtime.input.detach()
  })

  it('does not let an evolved Quest complete before the Quest Giver prerequisite', async () => {
    const game = useGameStore()
    expect((await game.send('创建一个 RPG')).success).toBe(true)
    const runtime = createStudioGameplayRuntime(game)
    settle(game, runtime)

    const evolved = await game.send('再加一个任务')
    expect(evolved.success).toBe(true)
    expect(game.currentWorldId).toBe('world-1')

    movePlayerNear(game, runtime, 'quest-1')
    const beforeAcceptance = pressEnter(game, runtime)
    expect(beforeAcceptance.gameplayRuleResults).toContainEqual(expect.objectContaining({
      ruleId: 'rpg-complete-main-quest',
      status: 'conditions_failed',
      committed: false,
      conditionResult: expect.objectContaining({
        conditions: expect.arrayContaining([
          expect.objectContaining({ type: 'ENTITY_GAMEPLAY_ROLE_EQUALS', status: 'passed' }),
        ]),
      }),
    }))
    expect(gameplayState(game, 'quest-1')).not.toHaveProperty('questCompleted')
    runtime.input.detach()
  })
})
