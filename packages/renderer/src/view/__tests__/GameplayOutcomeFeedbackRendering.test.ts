import { describe, expect, it } from 'vitest'
import type { Container, Graphics, Text } from 'pixi.js'
import type { GameplayOutcomeFeedback, RenderWorld } from '../../model'
import { DefaultPixiEntityRenderer } from '../PixiEntityRenderer'

interface MockDisplayState {
  alpha: number
  scale: { x: number; y: number }
  destroyed: boolean
  circleRadius: number
  text?: string
}

function graphics(): Graphics & { _state: MockDisplayState } {
  const state: MockDisplayState = {
    alpha: 1,
    scale: { x: 1, y: 1 },
    destroyed: false,
    circleRadius: 0,
  }
  return {
    _state: state,
    x: 0,
    y: 0,
    alpha: 1,
    scale: state.scale,
    lineStyle: () => {},
    drawCircle: (_x: number, _y: number, radius: number) => { state.circleRadius = radius },
    drawRect: () => {},
    moveTo: () => {},
    lineTo: () => {},
    beginFill: () => {},
    endFill: () => {},
    destroy: () => { state.destroyed = true },
  } as unknown as Graphics & { _state: MockDisplayState }
}

function text(value: string): Text & { _state: MockDisplayState } {
  const state: MockDisplayState = {
    alpha: 1,
    scale: { x: 1, y: 1 },
    destroyed: false,
    circleRadius: 0,
    text: value,
  }
  return {
    _state: state,
    text: value,
    x: 0,
    y: 0,
    alpha: 1,
    scale: state.scale,
    anchor: { set: () => {} },
    destroy: () => { state.destroyed = true },
  } as unknown as Text & { _state: MockDisplayState }
}

function container(): Container & { children: unknown[] } {
  const children: unknown[] = []
  return {
    children,
    position: { x: 0, y: 0 },
    addChild(child: unknown) { children.push(child); return child },
    removeChild(child: unknown) {
      const index = children.indexOf(child)
      if (index >= 0) children.splice(index, 1)
      return child
    },
  } as unknown as Container & { children: unknown[] }
}

function world(): RenderWorld {
  return { entities: [{ id: 'enemy-1', type: 'enemy', position: { x: 120, y: 300 } }] }
}

function feedback(kind: GameplayOutcomeFeedback['kind'], entityId = 'enemy-1'): GameplayOutcomeFeedback {
  return Object.freeze({
    feedbackId: `${kind}-1`,
    sourceEventId: 'event-1',
    kind,
    entityId,
    position: Object.freeze({ x: 120, y: 300 }),
    ...(kind === 'hit' ? { damageAmount: 25 } : {}),
  })
}

function renderer(now: () => number, feedbackContainer: Container): DefaultPixiEntityRenderer {
  return new DefaultPixiEntityRenderer(container(), {
    createGraphics: graphics,
    feedbackContainer,
    createFeedbackGraphics: graphics,
    createFeedbackText: text,
    now,
  })
}

describe('Pixi gameplay outcome feedback', () => {
  it('shows a target-bound hit ring and the authoritative damage amount', () => {
    let currentTime = 0
    const feedbackLayer = container()
    const outcomeRenderer = renderer(() => currentTime, feedbackLayer)

    outcomeRenderer.render(world())
    outcomeRenderer.presentGameplayOutcomes([feedback('hit')])

    expect(feedbackLayer.children).toHaveLength(2)
    expect((feedbackLayer.children[0] as Graphics).x).toBe(120)
    expect((feedbackLayer.children[0] as Graphics).y).toBe(300)
    expect((feedbackLayer.children[1] as Text).text).toBe('-25')

    currentTime = 180
    outcomeRenderer.render(world())
    expect((feedbackLayer.children[0] as Graphics).alpha).toBeLessThan(1)
    expect((feedbackLayer.children[0] as Graphics).scale.x).toBeGreaterThan(1)
  })

  it('uses distinct primitives for defeat and replacement arrival', () => {
    const feedbackLayer = container()
    const outcomeRenderer = renderer(() => 0, feedbackLayer)

    outcomeRenderer.presentGameplayOutcomes([feedback('defeat'), feedback('spawn', 'enemy-runtime-1')])

    expect(feedbackLayer.children).toHaveLength(2)
    expect((feedbackLayer.children[0] as Graphics & { _state: MockDisplayState })._state.circleRadius).toBe(20)
    expect((feedbackLayer.children[1] as Graphics & { _state: MockDisplayState })._state.circleRadius).toBe(22)
    expect((feedbackLayer.children[1] as Graphics).scale.x).toBe(0.35)
  })

  it('expires presentation-only feedback without retaining a dead Runtime entity', () => {
    let currentTime = 0
    const feedbackLayer = container()
    const outcomeRenderer = renderer(() => currentTime, feedbackLayer)

    outcomeRenderer.presentGameplayOutcomes([feedback('defeat')])
    const effect = feedbackLayer.children[0] as Graphics & { _state: MockDisplayState }
    currentTime = 900
    outcomeRenderer.render(world())

    expect(feedbackLayer.children).toHaveLength(0)
    expect(effect._state.destroyed).toBe(true)
  })

  it('clears effects explicitly when the active world changes', () => {
    const feedbackLayer = container()
    const outcomeRenderer = renderer(() => 0, feedbackLayer)

    outcomeRenderer.presentGameplayOutcomes([feedback('hit')])
    const effect = feedbackLayer.children[0] as Graphics & { _state: MockDisplayState }
    outcomeRenderer.clearGameplayFeedback()

    expect(feedbackLayer.children).toHaveLength(0)
    expect(effect._state.destroyed).toBe(true)
  })
})
