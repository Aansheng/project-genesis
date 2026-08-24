import { describe, expect, it } from 'vitest'
import {
  createDefaultHealthComponentForType,
  createHealthComponent,
  isHealthComponent,
} from '../index'

describe('HealthComponent', () => {
  it('creates an immutable bounded 100/100 default', () => {
    const health = createHealthComponent()

    expect(health).toEqual({ type: 'health', properties: { current: 100, max: 100 } })
    expect(Object.isFrozen(health)).toBe(true)
    expect(Object.isFrozen(health.properties)).toBe(true)
    expect(isHealthComponent(health)).toBe(true)
  })

  it('clamps explicit values without mutating the input', () => {
    expect(createHealthComponent(140, 100).properties).toEqual({ current: 100, max: 100 })
    expect(createHealthComponent(-4, 100).properties).toEqual({ current: 0, max: 100 })
    expect(createHealthComponent(25, 40).properties).toEqual({ current: 25, max: 40 })
  })

  it('adds the default component only to combat-capable semantic categories', () => {
    expect(createDefaultHealthComponentForType('player')?.properties).toEqual({ current: 100, max: 100 })
    expect(createDefaultHealthComponentForType('enemy')?.properties).toEqual({ current: 100, max: 100 })
    expect(createDefaultHealthComponentForType('npc')?.properties).toEqual({ current: 100, max: 100 })
    expect(createDefaultHealthComponentForType('item')).toBeUndefined()
    expect(createDefaultHealthComponentForType('terrain')).toBeUndefined()
  })
})
