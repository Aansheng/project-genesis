import { describe, expect, it } from 'vitest'
import type { Entity, World } from '@genesis/shared'
import { createPositionComponent, createVelocityComponent } from '@genesis/shared'
import { DefaultGravitySystem, DefaultVerticalMotionSystem } from '../systems'
import { DefaultRuntimeSystemRegistry } from '../system'
import { DefaultRuntimeExecutionLoop } from '../execution'

const entity = (y = 10, vy = 0): Entity => Object.freeze({ id: 'player', type: 'player', x: 0, y, components: Object.freeze([createPositionComponent(0, y), createVelocityComponent(0, vy)]) }) as unknown as Entity
const world = (value: Entity): World => Object.freeze({ entities: Object.freeze([value]) }) as World
function loop(gravity: number) {
  const registry = new DefaultRuntimeSystemRegistry(); registry.register(new DefaultGravitySystem(gravity)); registry.register(new DefaultVerticalMotionSystem())
  return new DefaultRuntimeExecutionLoop(registry)
}

describe('gravity → vertical motion integration', () => {
  it('accelerates velocity, then moves position', () => {
    const result = loop(2).tick(world(entity(10, -3)))
    expect(result.entities[0].y).toBe(9)
    expect(result.entities[0].components?.find((c) => c.type === 'velocity')?.properties.y).toBe(-1)
  })
  it('integrates an arc across multiple ticks without moving in GravitySystem alone', () => {
    let current = world(entity(0, 0)); const runner = loop(1)
    current = runner.tick(current); expect(current.entities[0].y).toBe(1)
    current = runner.tick(current); expect(current.entities[0].y).toBe(3)
    current = runner.tick(current); expect(current.entities[0].y).toBe(6)
  })
  it('preserves entities without velocity', () => {
    const staticEntity = { id: 'static', type: 'entity', x: 0, y: 0, components: Object.freeze([createPositionComponent(0, 0)]) } as unknown as Entity
    const registry = new DefaultRuntimeSystemRegistry(); registry.register(new DefaultGravitySystem(3)); registry.register(new DefaultVerticalMotionSystem())
    const result = new DefaultRuntimeExecutionLoop(registry).tick(Object.freeze({ entities: Object.freeze([staticEntity]) }) as unknown as World)
    expect(result.entities[0]).toBe(staticEntity)
  })
})
