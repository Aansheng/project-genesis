import { describe, expect, it } from 'vitest'
import {
  createPositionComponent,
  createTargetDirectedMovementComponent,
  createVelocityComponent,
} from '@genesis/shared'
import type { Entity, RuntimeComponent, World } from '@genesis/shared'
import { DefaultRuntimeExecutionLoop } from '../execution'
import { DefaultRuntimeSystemRegistry } from '../system'
import { DefaultTargetDirectedMovementSystem, DefaultVelocityMotionSystem } from '../systems'

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

function positionOf(value: Entity): { x: number; y: number } {
  return value.components!.find(component => component.type === 'position')!.properties as { x: number; y: number }
}

function velocityOf(value: Entity): { x: number; y: number } | undefined {
  return value.components?.find(component => component.type === 'velocity')?.properties as { x: number; y: number } | undefined
}

function run(worldValue: World): World {
  const registry = new DefaultRuntimeSystemRegistry()
  registry.register(new DefaultTargetDirectedMovementSystem())
  registry.register(new DefaultVelocityMotionSystem())
  return new DefaultRuntimeExecutionLoop(registry).tick(worldValue)
}

describe('DefaultTargetDirectedMovementSystem', () => {
  it('moves an enemy toward the current Runtime target through the registered loop', () => {
    const result = run(world(
      entity('player', 'player', 300, 300),
      entity('enemy', 'enemy', 100, 300, [createTargetDirectedMovementComponent('player', 2)]),
    ))
    const enemy = result.entities[1]!

    expect(positionOf(enemy)).toEqual({ x: 102, y: 300 })
    expect(velocityOf(enemy)).toEqual({ x: 2, y: 0 })
  })

  it('updates direction after the target Runtime Position changes', () => {
    const initial = run(world(
      entity('player', 'player', 300, 300),
      entity('enemy', 'enemy', 100, 300, [createTargetDirectedMovementComponent('player', 2)]),
    ))
    const movedTarget = Object.freeze({
      entities: Object.freeze(initial.entities.map(value => value.id === 'player'
        ? Object.freeze({
          ...value,
          components: Object.freeze(value.components!.map(component =>
            component.type === 'position' ? createPositionComponent(102, 100) : component,
          )),
        }) as unknown as Entity
        : value)),
    }) as unknown as World
    const result = run(movedTarget)

    expect(velocityOf(result.entities[1]!)).toEqual({ x: 0, y: -2 })
    expect(positionOf(result.entities[1]!)).toEqual({ x: 102, y: 298 })
  })

  it('normalizes diagonal direction so speed is not inflated', () => {
    const result = run(world(
      entity('player', 'player', 3, 4),
      entity('enemy', 'enemy', 0, 0, [createTargetDirectedMovementComponent('player', 2)]),
    ))
    const velocity = velocityOf(result.entities[1]!)!

    expect(velocity.x).toBeCloseTo(1.2)
    expect(velocity.y).toBeCloseTo(1.6)
    expect(Math.hypot(velocity.x, velocity.y)).toBeCloseTo(2)
  })

  it('stops safely at zero distance and when the target is unavailable', () => {
    const zeroDistance = run(world(
      entity('player', 'player', 10, 10),
      entity('enemy', 'enemy', 10, 10, [
        createTargetDirectedMovementComponent('player', 2),
        createVelocityComponent(2, 1),
      ]),
    ))
    const missingTarget = run(world(
      entity('enemy', 'enemy', 10, 10, [
        createTargetDirectedMovementComponent('missing', 2),
        createVelocityComponent(2, 1),
      ]),
    ))

    expect(positionOf(zeroDistance.entities[1]!)).toEqual({ x: 10, y: 10 })
    expect(velocityOf(zeroDistance.entities[1]!)).toEqual({ x: 0, y: 0 })
    expect(positionOf(missingTarget.entities[0]!)).toEqual({ x: 10, y: 10 })
    expect(velocityOf(missingTarget.entities[0]!)).toEqual({ x: 0, y: 0 })
  })

  it('rejects invalid speed without producing non-finite movement', () => {
    const result = run(world(
      entity('player', 'player', 300, 300),
      entity('enemy', 'enemy', 100, 300, [
        createTargetDirectedMovementComponent('player', Number.NaN),
        createVelocityComponent(3, 4),
      ]),
    ))

    expect(positionOf(result.entities[1]!)).toEqual({ x: 100, y: 300 })
    expect(velocityOf(result.entities[1]!)).toEqual({ x: 0, y: 0 })
    expect(Number.isFinite(positionOf(result.entities[1]!).x)).toBe(true)
    expect(Number.isFinite(positionOf(result.entities[1]!).y)).toBe(true)
  })
})

describe('DefaultVelocityMotionSystem', () => {
  it('integrates Velocity into Position for non-Player entities', () => {
    const result = new DefaultVelocityMotionSystem().update(world(
      entity('enemy', 'enemy', 2, 3, [createVelocityComponent(-1, 4)]),
    ))

    expect(positionOf(result.entities[0]!)).toEqual({ x: 1, y: 7 })
    expect(result.entities[0]!.x).toBe(1)
    expect(result.entities[0]!.y).toBe(7)
  })

  it('ignores entities without valid Position or Velocity data safely', () => {
    const noPosition = Object.freeze({
      id: 'enemy',
      type: 'enemy',
      x: 0,
      y: 0,
      components: Object.freeze([createVelocityComponent(1, 1)]),
    }) as unknown as Entity

    expect(new DefaultVelocityMotionSystem().update(world(noPosition)).entities[0]).toBe(noPosition)
  })
})
