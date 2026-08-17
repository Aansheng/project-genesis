import { describe, expect, it } from 'vitest'
import { DefaultCameraController } from '../DefaultCameraController'
import type { RenderWorld } from '../../model'

function world(x: number, y = 300): RenderWorld {
  return { entities: [{ id: 'player', type: 'player', position: { x, y } }] }
}

describe('platformer camera policy', () => {
  it('keeps ordinary movement visible and does not follow small jumps vertically', () => {
    const camera = new DefaultCameraController()
    camera.update(world(80))
    camera.update(world(120))
    expect(camera.getState()).toEqual({ x: 0, y: 300 })

    camera.update(world(120, 290))
    expect(camera.getState()).toEqual({ x: 0, y: 300 })
  })

  it('starts horizontal follow only after the dead zone', () => {
    const camera = new DefaultCameraController()
    camera.update(world(80))
    camera.update(world(321))
    expect(camera.getState()).toEqual({ x: 81, y: 300 })
  })
})
