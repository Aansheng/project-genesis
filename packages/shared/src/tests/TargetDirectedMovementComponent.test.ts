import { describe, expect, it } from 'vitest'
import {
  createTargetDirectedMovementComponent,
  isTargetDirectedMovementComponent,
} from '../components'

describe('TargetDirectedMovementComponent', () => {
  it('stores a frozen Runtime target identity and speed', () => {
    const component = createTargetDirectedMovementComponent('player', 1.5)

    expect(component).toEqual({
      type: 'target-directed-movement',
      properties: { targetEntityId: 'player', speed: 1.5 },
    })
    expect(Object.isFrozen(component)).toBe(true)
    expect(Object.isFrozen(component.properties)).toBe(true)
    expect(isTargetDirectedMovementComponent(component)).toBe(true)
  })

  it('does not identify another Runtime component as target-directed movement', () => {
    expect(isTargetDirectedMovementComponent({ type: 'velocity', properties: {} })).toBe(false)
  })
})
