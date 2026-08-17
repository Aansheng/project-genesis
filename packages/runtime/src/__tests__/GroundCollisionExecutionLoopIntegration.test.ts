import { describe, expect, it } from 'vitest'
import type { Entity, World } from '@genesis/shared'
import { createPositionComponent, createVelocityComponent } from '@genesis/shared'
import { DefaultGravitySystem, DefaultGroundCollisionSystem, DefaultVerticalMotionSystem } from '../systems'
import { DefaultRuntimeSystemRegistry } from '../system'
import { DefaultRuntimeExecutionLoop } from '../execution'

const player = (y: number, vy: number): Entity => Object.freeze({ id: 'player', type: 'player', x: 0, y, components: Object.freeze([createPositionComponent(0, y), createVelocityComponent(0, vy)]) }) as unknown as Entity
const world = (value: Entity): World => Object.freeze({ entities: Object.freeze([value]) }) as World
const velocity = (value: World) => value.entities[0].components?.find((c) => c.type === 'velocity')?.properties.y
function loop(gravity = 1, groundY = 400) {
  const registry = new DefaultRuntimeSystemRegistry(); registry.register(new DefaultGravitySystem(gravity)); registry.register(new DefaultVerticalMotionSystem()); registry.register(new DefaultGroundCollisionSystem(groundY))
  return new DefaultRuntimeExecutionLoop(registry)
}

describe('platformer ground collision integration', () => {
  it('clamps a falling player and resets downward velocity', () => {
    const result = loop(5).tick(world(player(399, 3)))
    expect(result.entities[0].y).toBe(400); expect(velocity(result)).toBe(0)
  })
  it('remains stable on repeated grounded ticks', () => {
    let current = world(player(400, 0)); const runner = loop(2)
    for (let i = 0; i < 20; i++) current = runner.tick(current)
    expect(current.entities[0].y).toBe(400); expect(velocity(current)).toBe(0)
  })
  it('preserves an airborne player and supports custom ground', () => {
    const result = loop(0, 200).tick(world(player(100, -4)))
    expect(result.entities[0].y).toBe(96); expect(velocity(result)).toBe(-4)
  })
})
