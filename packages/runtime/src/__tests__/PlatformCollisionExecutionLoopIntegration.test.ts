import { describe, expect, it } from 'vitest'
import type { Entity, World } from '@genesis/shared'
import {
  createCollisionBoundsComponent,
  createPositionComponent,
  createVelocityComponent,
} from '@genesis/shared'
import {
  DefaultGravitySystem,
  DefaultGroundCollisionSystem,
  DefaultRuntimeExecutionLoop,
  DefaultRuntimeSystemRegistry,
  DefaultVerticalMotionSystem,
} from '../index'

function player(x: number, y: number, velocityX = 0, velocityY = 0): Entity {
  return Object.freeze({
    id: 'player', type: 'player', x: 0, y: 0,
    components: Object.freeze([
      createPositionComponent(x, y),
      createVelocityComponent(velocityX, velocityY),
      createCollisionBoundsComponent(32, 48),
      Object.freeze({ type: 'semantic', properties: Object.freeze({ category: 'player', name: 'Player' }) }),
    ]),
  }) as unknown as Entity
}

function platform(): Entity {
  return Object.freeze({
    id: 'platform', type: 'terrain', x: 0, y: 0,
    components: Object.freeze([
      createPositionComponent(300, 320),
      createCollisionBoundsComponent(96, 24),
      Object.freeze({ type: 'semantic', properties: Object.freeze({ category: 'terrain', name: 'Platform' }) }),
    ]),
  }) as unknown as Entity
}

function runtime(gravity = 1) {
  const registry = new DefaultRuntimeSystemRegistry()
  registry.register(new DefaultGravitySystem(gravity))
  registry.register(new DefaultVerticalMotionSystem())
  registry.register(new DefaultGroundCollisionSystem(400))
  return new DefaultRuntimeExecutionLoop(registry)
}

function world(value: Entity, surface = platform()): World {
  return Object.freeze({ entities: Object.freeze([value, surface]) }) as unknown as World
}

function position(value: World) {
  return value.entities[0].components!.find(component => component.type === 'position')!.properties
}

function velocity(value: World) {
  return value.entities[0].components!.find(component => component.type === 'velocity')!.properties
}

describe('Runtime Platform collision execution loop', () => {
  it('lands on the Runtime Platform, remains supported, then falls after walking beyond its bounds', () => {
    const loop = runtime()
    let current = world(player(300, 275, 0, 5))

    for (let tick = 0; tick < 10 && velocity(current).y !== 0; tick += 1) current = loop.tick(current)
    expect(position(current)).toEqual({ x: 300, y: 308 })
    expect(velocity(current)).toEqual({ x: 0, y: 0 })

    for (let tick = 0; tick < 5; tick += 1) current = loop.tick(current)
    expect(position(current)).toEqual({ x: 300, y: 308 })
    expect(velocity(current)).toEqual({ x: 0, y: 0 })

    current = world(player(350, 308, 20, 0), current.entities[1])
    current = loop.tick(current)
    expect(position(current).x).toBe(370)
    expect(position(current).y).toBeGreaterThan(308)
    expect(velocity(current).y).toBeGreaterThan(0)
  })

  it('keeps the existing global ground plane and permits upward passage below the one-way Platform', () => {
    const groundResult = runtime().tick(world(player(80, 399, 0, 3)))
    expect(position(groundResult).y).toBe(400)
    expect(velocity(groundResult).y).toBe(0)

    const upwardResult = runtime(0).tick(world(player(300, 350, 0, -10)))
    expect(position(upwardResult).y).toBe(340)
    expect(velocity(upwardResult).y).toBe(-10)
  })
})
