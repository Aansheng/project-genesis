import { describe, expect, it } from 'vitest'
import type { Entity, World } from '@genesis/shared'
import { createPositionComponent, createVelocityComponent } from '@genesis/shared'
import { DefaultVerticalMotionSystem } from '../systems'

const entity = (x: number, y: number, vx: number, vy: number, type = 'player'): Entity => Object.freeze({
  id: type, type, x, y, components: Object.freeze([createPositionComponent(x, y), createVelocityComponent(vx, vy)]),
}) as unknown as Entity
const world = (...entities: Entity[]): World => Object.freeze({ entities: Object.freeze(entities) }) as World

describe('DefaultVerticalMotionSystem', () => {
  it('applies velocity to position and synchronizes legacy x/y fields', () => {
    const result = new DefaultVerticalMotionSystem().update(world(entity(10, 20, 2, -8)))
    expect(result.entities[0].x).toBe(12); expect(result.entities[0].y).toBe(12)
    expect(result.entities[0].components?.[0].properties).toEqual({ x: 12, y: 12 })
  })
  it('supports downward velocity, preserves velocity, and ignores non-players', () => {
    const enemy = entity(1, 2, 0, 5, 'enemy'); const result = new DefaultVerticalMotionSystem().update(world(enemy))
    expect(result.entities[0]).toBe(enemy)
    const player = new DefaultVerticalMotionSystem().update(world(entity(0, 0, 0, 5))).entities[0]
    expect(player.y).toBe(5); expect(player.components?.[1].properties.y).toBe(5)
  })
  it('leaves players without velocity unchanged and freezes output', () => {
    const player = { id: 'player', type: 'player', x: 3, y: 4, components: Object.freeze([createPositionComponent(3, 4)]) } as unknown as Entity
    const result = new DefaultVerticalMotionSystem().update(world(player))
    expect(result.entities[0]).toBe(player); expect(Object.isFrozen(result)).toBe(true)
  })
})
