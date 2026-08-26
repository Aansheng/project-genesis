/**
 * PlayerControllerIntegration — end-to-end verification of the player
 * controller pipeline: InputState → DefaultPlayerControllerSystem → World mutation.
 *
 * WO-S9-009 — Player Controller System Foundation
 * Architecture version v1.83
 *
 * Coverage:
 * - InputState (ArrowRight pressed) → PlayerController moves player right
 * - ArrowDown pressed → PlayerController moves player down
 * - Multiple keys pressed → diagonal movement
 * - No keys pressed → no movement
 * - Multiple players all move
 * - Mixed player/non-player entities
 * - PositionComponent updates correctly
 * - updateWithResult returns correct metadata
 */

import { describe, it, expect } from 'vitest'
import type { World } from '@genesis/shared'
import { createPositionComponent, isPositionComponent, isVelocityComponent } from '@genesis/shared'
import { DefaultInputState } from '../input'
import type { InputKey, InputProvider, InputState } from '../input'
import { DefaultPlayerControllerSystem } from '../systems'
import type { Entity } from '@genesis/shared'

// ---------------------------------------------------------------------------
// Mock InputProvider using DefaultInputState
// ---------------------------------------------------------------------------

class MockInputProvider implements InputProvider {
  private readonly keys: InputKey[]

  constructor(keys: InputKey[] = []) {
    this.keys = keys
  }

  getState(): InputState {
    return new DefaultInputState(new Set(this.keys))
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPlayer(id: string, x: number, y: number): Entity {
  return Object.freeze({
    id,
    type: 'player',
    x,
    y,
    components: Object.freeze([createPositionComponent(x, y)]),
  }) as unknown as Entity
}

function createNonPlayer(id: string, type: string, x: number, y: number): Entity {
  return Object.freeze({
    id,
    type,
    x,
    y,
    components: Object.freeze([createPositionComponent(x, y)]),
  }) as unknown as Entity
}

function horizontalVelocity(entity: Entity): number | undefined {
  return entity.components?.find(isVelocityComponent)?.properties.x
}

// ---------------------------------------------------------------------------

describe('PlayerControllerIntegration', () => {
  // -------------------------------------------------------------------------
  // Section 1 — Single key single player
  // -------------------------------------------------------------------------

  describe('single key single player', () => {
    it('pressing ArrowRight moves player right', () => {
      const provider = new MockInputProvider(['ArrowRight'])
      const system = new DefaultPlayerControllerSystem(provider)
      const world = Object.freeze({
        entities: Object.freeze([createPlayer('player-1', 5, 5)]),
      }) as unknown as World

      const result = system.update(world)
      expect(result.entities[0].x).toBe(5)
      expect(result.entities[0].y).toBe(5)
      expect(horizontalVelocity(result.entities[0])).toBe(1)
    })

    it('pressing ArrowDown moves player down', () => {
      const provider = new MockInputProvider(['ArrowDown'])
      const system = new DefaultPlayerControllerSystem(provider)
      const world = Object.freeze({
        entities: Object.freeze([createPlayer('player-1', 5, 5)]),
      }) as unknown as World

      const result = system.update(world)
      expect(result.entities[0].y).toBe(6)
    })

    it('pressing ArrowLeft moves player left', () => {
      const provider = new MockInputProvider(['ArrowLeft'])
      const system = new DefaultPlayerControllerSystem(provider)
      const world = Object.freeze({
        entities: Object.freeze([createPlayer('player-1', 5, 5)]),
      }) as unknown as World

      const result = system.update(world)
      expect(result.entities[0].x).toBe(5)
      expect(horizontalVelocity(result.entities[0])).toBe(-1)
    })

    it('pressing ArrowUp moves player up', () => {
      const provider = new MockInputProvider(['ArrowUp'])
      const system = new DefaultPlayerControllerSystem(provider)
      const world = Object.freeze({
        entities: Object.freeze([createPlayer('player-1', 5, 5)]),
      }) as unknown as World

      const result = system.update(world)
      expect(result.entities[0].y).toBe(4)
    })
  })

  // -------------------------------------------------------------------------
  // Section 2 — Diagonal movement
  // -------------------------------------------------------------------------

  describe('diagonal movement', () => {
    it('pressing ArrowRight and ArrowDown moves player diagonally', () => {
      const provider = new MockInputProvider(['ArrowRight', 'ArrowDown'])
      const system = new DefaultPlayerControllerSystem(provider)
      const world = Object.freeze({
        entities: Object.freeze([createPlayer('player-1', 0, 0)]),
      }) as unknown as World

      const result = system.update(world)
      expect(result.entities[0].x).toBe(0)
      expect(result.entities[0].y).toBe(1)
      expect(horizontalVelocity(result.entities[0])).toBe(1)
    })

    it('pressing ArrowUp and ArrowLeft moves player diagonally', () => {
      const provider = new MockInputProvider(['ArrowUp', 'ArrowLeft'])
      const system = new DefaultPlayerControllerSystem(provider, 3)
      const world = Object.freeze({
        entities: Object.freeze([createPlayer('player-1', 10, 10)]),
      }) as unknown as World

      const result = system.update(world)
      expect(result.entities[0].x).toBe(10)
      expect(result.entities[0].y).toBe(7)
      expect(horizontalVelocity(result.entities[0])).toBe(-3)
    })
  })

  // -------------------------------------------------------------------------
  // Section 3 — No movement
  // -------------------------------------------------------------------------

  describe('no movement', () => {
    it('no keys pressed → no movement', () => {
      const provider = new MockInputProvider()
      const system = new DefaultPlayerControllerSystem(provider)
      const world = Object.freeze({
        entities: Object.freeze([createPlayer('player-1', 5, 5)]),
      }) as unknown as World

      const result = system.update(world)
      expect(result.entities[0].x).toBe(5)
      expect(result.entities[0].y).toBe(5)
    })
  })

  // -------------------------------------------------------------------------
  // Section 4 — Multiple players
  // -------------------------------------------------------------------------

  describe('multiple players', () => {
    it('all players move when ArrowRight is pressed', () => {
      const provider = new MockInputProvider(['ArrowRight'])
      const system = new DefaultPlayerControllerSystem(provider)
      const world = Object.freeze({
        entities: Object.freeze([
          createPlayer('player-1', 0, 0),
          createPlayer('player-2', 10, 10),
        ]),
      }) as unknown as World

      const result = system.update(world)
      expect(result.entities[0].x).toBe(0)
      expect(result.entities[1].x).toBe(10)
      expect(horizontalVelocity(result.entities[0])).toBe(1)
      expect(horizontalVelocity(result.entities[1])).toBe(1)
    })
  })

  // -------------------------------------------------------------------------
  // Section 5 — Mixed entities
  // -------------------------------------------------------------------------

  describe('mixed entities', () => {
    it('only player entities move; non-player entities stay', () => {
      const provider = new MockInputProvider(['ArrowRight'])
      const system = new DefaultPlayerControllerSystem(provider)
      const world = Object.freeze({
        entities: Object.freeze([
          createPlayer('player-1', 0, 0),
          createNonPlayer('enemy-1', 'enemy', 20, 20),
          createPlayer('player-2', 5, 5),
        ]),
      }) as unknown as World

      const result = system.update(world)
      expect(result.entities[0].x).toBe(0)
      expect(result.entities[1].x).toBe(20)
      expect(result.entities[2].x).toBe(5)
      expect(horizontalVelocity(result.entities[0])).toBe(1)
      expect(horizontalVelocity(result.entities[2])).toBe(1)
    })
  })

  // -------------------------------------------------------------------------
  // Section 6 — PositionComponent updates
  // -------------------------------------------------------------------------

  describe('PositionComponent updates', () => {
    it('updates both legacy x/y and PositionComponent', () => {
      const provider = new MockInputProvider(['ArrowRight', 'ArrowDown'])
      const system = new DefaultPlayerControllerSystem(provider, 2)
      const world = Object.freeze({
        entities: Object.freeze([createPlayer('player-1', 1, 1)]),
      }) as unknown as World

      const result = system.update(world)
      const entity = result.entities[0]

      // Legacy x/y updated
      expect(entity.x).toBe(1)
      expect(entity.y).toBe(3)

      // PositionComponent updated
      const pos = entity.components?.find(isPositionComponent)
      expect(pos?.properties.x).toBe(1)
      expect(pos?.properties.y).toBe(3)
      expect(horizontalVelocity(entity)).toBe(2)
    })

    it('preserves other components when updating PositionComponent', () => {
      const provider = new MockInputProvider(['ArrowRight'])
      const system = new DefaultPlayerControllerSystem(provider)
      const player = Object.freeze({
        id: 'player-1',
        type: 'player',
        x: 0,
        y: 0,
        components: Object.freeze([
          createPositionComponent(0, 0),
          { type: 'health', properties: { current: 100, max: 100 } },
          { type: 'inventory', properties: { items: ['sword'] } },
        ]),
      }) as unknown as Entity

      const world = Object.freeze({
        entities: Object.freeze([player]),
      }) as unknown as World

      const result = system.update(world)
      const entity = result.entities[0]
      const components = entity.components!

      // PositionComponent updated
      const pos = components.find(isPositionComponent)
      expect(pos?.properties.x).toBe(0)
      expect(horizontalVelocity(entity)).toBe(1)

      // Other components preserved
      const health = components.find((c) => c.type === 'health')
      expect(health?.properties).toEqual({ current: 100, max: 100 })

      const inventory = components.find((c) => c.type === 'inventory')
      expect(inventory?.properties).toEqual({ items: ['sword'] })
    })
  })

  // -------------------------------------------------------------------------
  // Section 7 — updateWithResult metadata
  // -------------------------------------------------------------------------

  describe('updateWithResult metadata', () => {
    it('returns movedPlayers and delta for a single player', () => {
      const provider = new MockInputProvider(['ArrowRight'])
      const system = new DefaultPlayerControllerSystem(provider)
      const world = Object.freeze({
        entities: Object.freeze([createPlayer('player-1', 0, 0)]),
      }) as unknown as World

      const { result } = system.updateWithResult(world)
      expect(result.movedPlayers).toBe(1)
      expect(result.deltaX).toBe(1)
      expect(result.deltaY).toBe(0)
    })

    it('returns movedPlayers=0 for non-player entities', () => {
      const provider = new MockInputProvider(['ArrowRight'])
      const system = new DefaultPlayerControllerSystem(provider)
      const world = Object.freeze({
        entities: Object.freeze([createNonPlayer('enemy-1', 'enemy', 0, 0)]),
      }) as unknown as World

      const { result } = system.updateWithResult(world)
      expect(result.movedPlayers).toBe(0)
    })
  })
})
