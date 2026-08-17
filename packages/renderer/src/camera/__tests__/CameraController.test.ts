import { describe, expect, it } from 'vitest'
import { DefaultCameraController } from '../DefaultCameraController'
import type { RenderWorld } from '../../model'

const world = (x: number, y: number): RenderWorld => ({ entities: [{ id: 'player', type: 'player', position: { x, y } }] })
const empty = (): RenderWorld => ({ entities: [] })

describe('DefaultCameraController — dead-zone contract', () => {
  it('starts with horizontal origin and stable vertical baseline', () => {
    const camera = new DefaultCameraController()
    expect(camera.update(world(80, 300))).toEqual({ x: 0, y: 300 })
    expect(Object.isFrozen(camera.getState())).toBe(true)
  })
  it('does not follow movement inside the horizontal dead zone', () => {
    const camera = new DefaultCameraController(); camera.update(world(80, 300))
    expect(camera.update(world(120, 290))).toEqual({ x: 0, y: 300 })
  })
  it('follows horizontally after the threshold', () => {
    const camera = new DefaultCameraController(); camera.update(world(80, 300))
    expect(camera.update(world(321, 300))).toEqual({ x: 81, y: 300 })
    expect(camera.update(world(0, 250))).toEqual({ x: 81, y: 300 })
  })
  it('supports a custom dead zone and tracks the first player', () => {
    const camera = new DefaultCameraController(10)
    camera.update({ entities: [{ id: 'first', type: 'player', position: { x: 0, y: 4 } }, { id: 'second', type: 'player', position: { x: 100, y: 8 } }] })
    expect(camera.update(world(11, 9))).toEqual({ x: 1, y: 4 })
  })
  it('preserves state when player data is absent', () => {
    const camera = new DefaultCameraController(); camera.update(world(80, 300)); camera.update(world(321, 300))
    expect(camera.update(empty())).toEqual({ x: 81, y: 300 })
  })
})
