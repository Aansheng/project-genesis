import { describe, expect, it } from 'vitest'
import {
  createHealthComponent,
  createPositionComponent,
} from '@genesis/shared'
import type { Entity, RuntimeComponent, World } from '@genesis/shared'
import type { InputKey, InputProvider } from '../input'
import {
  DefaultPlayerAttackRequestSystem,
  DEFAULT_PLAYER_ATTACK_RANGE,
} from '../systems'
import { DefaultRuntimeExecutionLoop } from '../execution'
import { DefaultRuntimeSystemRegistry } from '../system'

class TestInputProvider implements InputProvider {
  pressed = false

  getState() {
    return Object.freeze({
      isPressed: (key: InputKey) => key === 'Space' && this.pressed,
    })
  }
}

function entity(
  id: string,
  type: string,
  x: number,
  y: number,
  components: readonly RuntimeComponent[] = [],
): Entity {
  return Object.freeze({
    id,
    type,
    x,
    y,
    components: Object.freeze([createPositionComponent(x, y), ...components]),
  }) as unknown as Entity
}

function world(...entities: Entity[]): World {
  return Object.freeze({ entities: Object.freeze(entities) }) as unknown as World
}

function runtime(input: TestInputProvider) {
  const registry = new DefaultRuntimeSystemRegistry()
  registry.register(new DefaultPlayerAttackRequestSystem(input))
  const loop = new DefaultRuntimeExecutionLoop(registry)
  return { loop, collector: loop.gameplayEventCollector }
}

describe('DefaultPlayerAttackRequestSystem', () => {
  it('emits one request on a Space press edge for the nearest healthy target', () => {
    const input = new TestInputProvider()
    const { loop } = runtime(input)
    const source = world(
      entity('player', 'player', 0, 0),
      entity('enemy-far', 'enemy', 40, 0, [createHealthComponent()]),
      entity('enemy-near', 'enemy', 20, 0, [createHealthComponent()]),
      entity('enemy-defeated', 'enemy', 5, 0, [createHealthComponent(0)]),
    )

    input.pressed = true
    const pressed = loop.tickWithResult(source)

    expect(pressed.world.entities).toEqual(source.entities)
    expect(pressed.gameplayEvents).toContainEqual(expect.objectContaining({
      type: 'ENTITY_ATTACK_REQUESTED',
      actorEntityId: 'player',
      targetEntityId: 'enemy-near',
      position: { x: 0, y: 0 },
      payload: { inputKey: 'Space', distance: 20, range: DEFAULT_PLAYER_ATTACK_RANGE },
    }))

    const held = loop.tickWithResult(pressed.world)
    expect(held.gameplayEvents).toEqual([])

    input.pressed = false
    loop.tick(held.world)
    input.pressed = true
    const pressedAgain = loop.tickWithResult(held.world)
    const pressedAgainEvents = pressedAgain.gameplayEvents ?? []
    expect(pressedAgainEvents).toHaveLength(1)
    expect(pressedAgainEvents[0]).toMatchObject({
      type: 'ENTITY_ATTACK_REQUESTED',
      targetEntityId: 'enemy-near',
    })
  })

  it('uses stable target ID order for equal-distance targets and no-ops outside range', () => {
    const input = new TestInputProvider()
    const { loop } = runtime(input)
    const tied = world(
      entity('player', 'player', 0, 0),
      entity('enemy-z', 'enemy', 30, 0, [createHealthComponent()]),
      entity('enemy-a', 'enemy', -30, 0, [createHealthComponent()]),
    )

    input.pressed = true
    const selected = loop.tickWithResult(tied)
    expect(selected.gameplayEvents).toContainEqual(expect.objectContaining({
      type: 'ENTITY_ATTACK_REQUESTED',
      targetEntityId: 'enemy-a',
    }))

    input.pressed = false
    loop.tick(selected.world)
    const noTarget = world(
      entity('player', 'player', 0, 0),
      entity('enemy-outside-range', 'enemy', DEFAULT_PLAYER_ATTACK_RANGE + 1, 0, [createHealthComponent()]),
    )
    input.pressed = true
    expect(loop.tickWithResult(noTarget).gameplayEvents).toEqual([])
  })

  it('does not mutate World or select entities without a valid target category and Health', () => {
    const input = new TestInputProvider()
    const { loop } = runtime(input)
    const source = world(
      entity('player', 'player', 0, 0),
      entity('npc', 'npc', 10, 0, [createHealthComponent()]),
      entity('enemy-without-health', 'enemy', 10, 0),
    )

    input.pressed = true
    const result = loop.tickWithResult(source)

    expect(result.gameplayEvents).toEqual([])
    expect(result.world.entities).toEqual(source.entities)
  })
})
