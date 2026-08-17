import { describe, expect, it } from 'vitest'
import { createPositionComponent, isVelocityComponent } from '@genesis/shared'
import { DefaultInputState, type InputKey, type InputProvider, type InputState } from '../input'
import { DefaultJumpSystem } from '../systems/DefaultJumpSystem'
import { DefaultGravitySystem } from '../systems/DefaultGravitySystem'
import { DefaultVerticalMotionSystem } from '../systems/DefaultVerticalMotionSystem'
import { DefaultGroundCollisionSystem } from '../systems/DefaultGroundCollisionSystem'
import type { Entity, World } from '@genesis/shared'

class TestInput implements InputProvider {
  pressed = new Set<InputKey>()
  getState(): InputState { return new DefaultInputState(this.pressed) }
}

function worldAt(y: number): World {
  const player = Object.freeze({
    id: 'player', type: 'player', x: 80, y,
    components: Object.freeze([createPositionComponent(80, y)]),
  }) as unknown as Entity
  return Object.freeze({ entities: Object.freeze([player]) }) as unknown as World
}

describe('platformer control semantics', () => {
  it('uses a press edge, follows a smooth arc, and lands', () => {
    const input = new TestInput()
    const jump = new DefaultJumpSystem(input, 4)
    const gravity = new DefaultGravitySystem(1)
    const motion = new DefaultVerticalMotionSystem()
    const collision = new DefaultGroundCollisionSystem(400)
    let world = worldAt(400)

    input.pressed.add('Space')
    world = motion.update(gravity.update(jump.update(world)))
    expect(world.entities[0].y).toBe(397)
    expect(world.entities[0].components?.some(isVelocityComponent)).toBe(true)

    const held = motion.update(gravity.update(jump.update(world)))
    expect(held.entities[0].y).toBe(395)

    input.pressed.clear()
    for (let i = 0; i < 20; i++) {
      world = collision.update(motion.update(gravity.update(jump.update(world))))
    }
    expect(world.entities[0].y).toBe(400)
    const velocity = world.entities[0].components?.find(isVelocityComponent)
    expect(velocity?.properties.y).toBe(0)

    input.pressed.add('Space')
    world = motion.update(gravity.update(jump.update(world)))
    expect(world.entities[0].y).toBeLessThan(400)
  })
})
