import { describe, expect, it } from 'vitest'
import type { Entity, World } from '@genesis/shared'
import { createPositionComponent, createVelocityComponent } from '@genesis/shared'
import { DefaultGravitySystem } from '../systems'

const entity = (vy: number, type = 'player'): Entity => Object.freeze({
  id: type, type, x: 10, y: 20,
  components: Object.freeze([createPositionComponent(10, 20), createVelocityComponent(2, vy)]),
}) as unknown as Entity
const world = (...entities: Entity[]): World => Object.freeze({ entities: Object.freeze(entities) }) as World
const velocity = (value: World) => value.entities[0].components?.find((c) => c.type === 'velocity')

describe('DefaultGravitySystem — velocity contract', () => {
  it('has the runtime system interface and name', () => {
    const system = new DefaultGravitySystem()
    expect(system.name).toBe('GravitySystem')
    expect(typeof system.update).toBe('function'); expect(typeof system.updateWithResult).toBe('function')
  })
  it('increments vertical velocity and does not move position', () => {
    const result = new DefaultGravitySystem(3).updateWithResult(world(entity(-4)))
    expect(velocity(result.world)?.properties).toEqual({ x: 2, y: -1 })
    expect(result.world.entities[0].y).toBe(20)
    expect(result.result).toEqual({ affectedEntities: 1, gravity: 3 })
  })
  it('supports zero, negative, and fractional gravity', () => {
    expect(velocity(new DefaultGravitySystem(0).update(world(entity(2))))?.properties.y).toBe(2)
    expect(velocity(new DefaultGravitySystem(-0.5).update(world(entity(2))))?.properties.y).toBe(1.5)
  })
  it('affects only entities with velocity', () => {
    const staticEntity = { id: 'static', type: 'entity', x: 0, y: 0, components: Object.freeze([createPositionComponent(0, 0)]) } as unknown as Entity
    const result = new DefaultGravitySystem().updateWithResult(world(entity(0), staticEntity))
    expect(result.result.affectedEntities).toBe(1); expect(result.world.entities[1]).toBe(staticEntity)
  })
  it('is immutable, frozen, and deterministic', () => {
    const source = world(entity(-1)); const system = new DefaultGravitySystem(2)
    const first = system.update(source); const second = system.update(source)
    expect(first).toEqual(second); expect(Object.isFrozen(first)).toBe(true)
    expect(source.entities[0].y).toBe(20); expect(velocity(source)?.properties.y).toBe(-1)
  })
})
