import { describe, expect, it } from 'vitest'
import { DefaultCameraController } from '../DefaultCameraController'
import { DefaultPixiEntityRenderer } from '../../view/PixiEntityRenderer'
import type { RenderWorld } from '../../model'

const player = (x: number, y: number): RenderWorld => ({ entities: [{ id: 'player', type: 'player', position: { x, y } }] })
function renderer(camera: DefaultCameraController) {
  const container = { position: { x: 0, y: 0 }, children: [] as any[], addChild(child: any) { this.children.push(child); return child }, removeChild() {} }
  const view = new DefaultPixiEntityRenderer(container as any, { cameraController: camera, createGraphics: (() => ({ beginFill() {}, drawRect() {}, drawCircle() {}, endFill() {}, destroy() {}, x: 0, y: 0 })) as any })
  return { view, container }
}

describe('camera and renderer integration', () => {
  it('keeps ordinary movement visible inside the dead zone', () => {
    const camera = new DefaultCameraController(); const { view, container } = renderer(camera)
    view.render(player(80, 300)); view.render(player(120, 290))
    expect(camera.getState()).toEqual({ x: 0, y: 300 }); expect(container.position).toEqual({ x: 0, y: -300 })
  })
  it('applies horizontal camera offset after the dead zone', () => {
    const camera = new DefaultCameraController(); const { view, container } = renderer(camera)
    view.render(player(80, 300)); view.render(player(321, 300))
    expect(camera.getState()).toEqual({ x: 81, y: 300 }); expect(container.position).toEqual({ x: -81, y: -300 })
  })
  it('keeps vertical camera stable through a jump and preserves state without a player', () => {
    const camera = new DefaultCameraController(); const { view, container } = renderer(camera)
    view.render(player(80, 300)); view.render(player(80, 250)); view.render({ entities: [] })
    expect(camera.getState()).toEqual({ x: 0, y: 300 }); expect(container.position.y).toBe(-300)
  })
})
