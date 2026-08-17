import { describe, expect, it } from 'vitest'
import type { Entity, World } from '@genesis/shared'
import { createPositionComponent, createVelocityComponent } from '@genesis/shared'
import { DefaultInputState } from '../input'
import type { InputKey, InputProvider, InputState } from '../input'
import { DefaultRuntimeExecutionLoop } from '../execution'
import { DefaultRuntimeSystemRegistry } from '../system'
import { DefaultGravitySystem, DefaultGroundCollisionSystem, DefaultJumpSystem, DefaultVerticalMotionSystem } from '../systems'

class Input implements InputProvider { pressed = new Set<InputKey>(); getState(): InputState { return new DefaultInputState(this.pressed) } }
const player = (y = 400, vy = 0): Entity => Object.freeze({ id: 'player', type: 'player', x: 0, y, components: Object.freeze([createPositionComponent(0, y), createVelocityComponent(0, vy)]) }) as unknown as Entity
const world = (value: Entity): World => Object.freeze({ entities: Object.freeze([value]) }) as World
const getVy = (value: World) => value.entities[0].components?.find((c) => c.type === 'velocity')?.properties.y
function setup(input: Input, jump = 10, gravity = 2) {
  const registry = new DefaultRuntimeSystemRegistry()
  registry.register(new DefaultJumpSystem(input, jump)); registry.register(new DefaultGravitySystem(gravity))
  registry.register(new DefaultVerticalMotionSystem()); registry.register(new DefaultGroundCollisionSystem(400))
  return new DefaultRuntimeExecutionLoop(registry)
}

describe('platformer motion integration', () => {
  it('runs jump → gravity → vertical motion → collision', () => {
    const input = new Input(); input.pressed.add('Space'); const loop = setup(input)
    const jumped = loop.tick(world(player()))
    expect(jumped.entities[0].y).toBe(392); expect(getVy(jumped)).toBe(-8)
    input.pressed.clear(); let current = jumped; let minimum = current.entities[0].y
    for (let i = 0; i < 20; i++) { current = loop.tick(current); minimum = Math.min(minimum, current.entities[0].y) }
    expect(minimum).toBeLessThan(400); expect(current.entities[0].y).toBe(400); expect(getVy(current)).toBe(0)
  })
  it('does not retrigger held Space and accepts a post-landing press', () => {
    const input = new Input(); input.pressed.add('Space'); const loop = setup(input)
    const first = loop.tick(world(player())); const held = loop.tick(first)
    expect(getVy(held)).toBe(-6); expect(held.entities[0].y).toBeLessThan(first.entities[0].y)
    input.pressed.clear(); let landed = held; for (let i = 0; i < 30; i++) landed = loop.tick(landed)
    expect(landed.entities[0].y).toBe(400); input.pressed.add('Space')
    expect(getVy(loop.tick(landed))).toBe(-8)
  })
})
