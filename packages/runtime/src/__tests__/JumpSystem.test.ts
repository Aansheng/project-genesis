import { describe, expect, it } from 'vitest'
import type { Entity, World } from '@genesis/shared'
import { createPositionComponent, createVelocityComponent } from '@genesis/shared'
import { DefaultInputState } from '../input'
import type { InputKey, InputProvider, InputState } from '../input'
import { DefaultJumpSystem } from '../systems'

class Input implements InputProvider {
  pressed = new Set<InputKey>()
  getState(): InputState { return new DefaultInputState(this.pressed) }
}
const world = (...entities: Entity[]): World => Object.freeze({ entities: Object.freeze(entities) }) as World
const player = (y = 400, velocity?: number, horizontal = 0): Entity => Object.freeze({
  id: 'player', type: 'player', x: 0, y,
  components: Object.freeze([createPositionComponent(0, y), ...(velocity === undefined ? [] : [createVelocityComponent(horizontal, velocity)])]),
}) as unknown as Entity
const component = (entity: Entity, type: string) => entity.components?.find((value) => value.type === type)

describe('DefaultJumpSystem — velocity contract', () => {
  it('has the runtime system interface and name', () => {
    const system = new DefaultJumpSystem(new Input(), 12)
    expect(system.name).toBe('JumpSystem')
    expect(typeof system.update).toBe('function')
    expect(typeof system.updateWithResult).toBe('function')
  })
  it('sets negative vertical velocity without moving position', () => {
    const input = new Input(); input.pressed.add('Space')
    const result = new DefaultJumpSystem(input, 12).updateWithResult(world(player()))
    expect(component(result.world.entities[0], 'position')?.properties.y).toBe(400)
    expect(component(result.world.entities[0], 'velocity')?.properties.y).toBe(-12)
    expect(result.result).toEqual({ jumpedPlayers: 1, jumpHeight: 12 })
  })
  it('preserves horizontal velocity and adds velocity when absent', () => {
    const input = new Input(); input.pressed.add('Space')
    const result = new DefaultJumpSystem(input, 8).update(world(player(400, 0, 3)))
    expect(component(result.entities[0], 'velocity')?.properties).toEqual({ x: 3, y: -8 })
  })
  it('requires position and ignores non-players', () => {
    const input = new Input(); input.pressed.add('Space')
    const missing = { id: 'missing', type: 'player', x: 0, y: 0 } as unknown as Entity
    const enemy = { ...player(), id: 'enemy', type: 'enemy' } as unknown as Entity
    const result = new DefaultJumpSystem(input).updateWithResult(world(missing, enemy))
    expect(result.result.jumpedPlayers).toBe(0)
  })
  it('only jumps while grounded', () => {
    const input = new Input(); input.pressed.add('Space')
    const result = new DefaultJumpSystem(input).updateWithResult(world(player(300, -2)))
    expect(result.result.jumpedPlayers).toBe(0)
    expect(component(result.world.entities[0], 'velocity')?.properties.y).toBe(-2)
  })
  it('uses a press edge and does not retrigger while held', () => {
    const input = new Input(); input.pressed.add('Space'); const system = new DefaultJumpSystem(input)
    const first = system.update(world(player())); const second = system.update(first)
    expect(component(first.entities[0], 'velocity')?.properties.y).toBe(-10)
    expect(component(second.entities[0], 'velocity')?.properties.y).toBe(-10)
  })
  it('allows a second jump after release and landing', () => {
    const input = new Input(); const system = new DefaultJumpSystem(input)
    input.pressed.add('Space'); system.update(world(player()))
    input.pressed.clear(); system.update(world(player(400, 0)))
    input.pressed.add('Space'); const second = system.update(world(player(400, 0)))
    expect(component(second.entities[0], 'velocity')?.properties.y).toBe(-10)
  })
  it('returns frozen immutable output and preserves input', () => {
    const input = new Input(); input.pressed.add('Space'); const source = world(player())
    const result = new DefaultJumpSystem(input).update(source)
    expect(Object.isFrozen(result)).toBe(true); expect(Object.isFrozen(result.entities)).toBe(true)
    expect(component(source.entities[0], 'velocity')).toBeUndefined()
  })
  it('returns a stable no-op when Space is not pressed', () => {
    const source = world(player(400, 0)); const system = new DefaultJumpSystem(new Input())
    expect(system.update(source)).toEqual(system.update(source))
  })
})
