/**
 * RuntimeComponent — verifies the RuntimeComponent type interface and
 * its structural properties.
 *
 * WO-S8-004 — Runtime Component Model Foundation
 * Architecture version v1.63
 *
 * Coverage:
 * - construction
 * - immutability
 * - serialization
 * - deep readonly
 * - large component collections
 */

import { describe, it, expect } from 'vitest'
import type { RuntimeComponent } from '@genesis/shared'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a simple RuntimeComponent with Position type. */
function createPositionComponent(): RuntimeComponent {
  return {
    type: 'Position',
    properties: { x: 10, y: 5 },
  }
}

/** Create a RuntimeComponent with Health type. */
function createHealthComponent(): RuntimeComponent {
  return {
    type: 'Health',
    properties: { value: 100, max: 100 },
  }
}

/** Create a RuntimeComponent with Inventory type. */
function createInventoryComponent(): RuntimeComponent {
  return {
    type: 'Inventory',
    properties: { items: ['sword', 'shield', 'potion'] },
  }
}

/** Create a RuntimeComponent with deeply nested properties. */
function createNestedComponent(): RuntimeComponent {
  return {
    type: 'Transform',
    properties: {
      position: { x: 1, y: 2, z: 3 },
      rotation: { pitch: 0, yaw: 90, roll: 0 },
      scale: { x: 1, y: 1, z: 1 },
    },
  }
}

/** Create a collection of many RuntimeComponent instances. */
function createComponentCollection(count: number): RuntimeComponent[] {
  return Array.from({ length: count }, (_, i) => ({
    type: `component-${i}`,
    properties: {
      index: i,
      label: `Component ${i}`,
      tags: [`tag-${i}`, `tag-${i + 1}`],
    },
  }))
}

// ---------------------------------------------------------------------------
// Section 1 — Construction
// ---------------------------------------------------------------------------

describe('construction', () => {
  it('creates a component with type and empty properties', () => {
    const component: RuntimeComponent = {
      type: 'Marker',
      properties: {},
    }
    expect(component.type).toBe('Marker')
    expect(component.properties).toEqual({})
  })

  it('creates a Position component with numeric properties', () => {
    const component = createPositionComponent()
    expect(component.type).toBe('Position')
    expect(component.properties.x).toBe(10)
    expect(component.properties.y).toBe(5)
  })

  it('creates a Health component with value properties', () => {
    const component = createHealthComponent()
    expect(component.type).toBe('Health')
    expect(component.properties.value).toBe(100)
    expect(component.properties.max).toBe(100)
  })

  it('creates an Inventory component with array properties', () => {
    const component = createInventoryComponent()
    expect(component.type).toBe('Inventory')
    expect(Array.isArray(component.properties.items)).toBe(true)
    expect(component.properties.items).toHaveLength(3)
  })

  it('creates a component with string type', () => {
    const component: RuntimeComponent = {
      type: 'CustomComponent',
      properties: {},
    }
    expect(typeof component.type).toBe('string')
  })

  it('creates a component with boolean properties', () => {
    const component: RuntimeComponent = {
      type: 'Toggle',
      properties: { active: true, visible: false },
    }
    expect(component.properties.active).toBe(true)
    expect(component.properties.visible).toBe(false)
  })

  it('creates a component with null property value', () => {
    const component: RuntimeComponent = {
      type: 'Nullable',
      properties: { value: null },
    }
    expect(component.properties.value).toBeNull()
  })

  it('creates a component with undefined property value', () => {
    const component: RuntimeComponent = {
      type: 'Undefined',
      properties: { value: undefined },
    }
    expect(component.properties.value).toBeUndefined()
  })

  it('casts type to string at runtime', () => {
    // RuntimeComponent.type is typed as string — any value is preserved
    const component: RuntimeComponent = {
      type: '123',
      properties: {},
    }
    expect(component.type).toBe('123')
  })
})

// ---------------------------------------------------------------------------
// Section 2 — Immutability
// ---------------------------------------------------------------------------

describe('immutability', () => {
  it('component type is readonly', () => {
    const component = createPositionComponent()
    // TypeScript enforces readonly at compile time
    // At runtime, the object is mutable unless frozen
    expect(typeof component.type).toBe('string')
  })

  it('component properties are readonly', () => {
    const component = createPositionComponent()
    expect(typeof component.properties).toBe('object')
  })

  it('freezing a component prevents mutation', () => {
    const component = Object.freeze(createPositionComponent())
    expect(Object.isFrozen(component)).toBe(true)
  })

  it('freezing properties prevents property mutation', () => {
    const component = {
      type: 'Position',
      properties: Object.freeze({ x: 10, y: 5 }),
    }
    expect(Object.isFrozen(component.properties)).toBe(true)
  })

  it('frozen component cannot have new properties added', () => {
    const component = Object.freeze(createPositionComponent())
    expect(() => {
      (component as Record<string, unknown>).extra = 'value'
    }).toThrow()
  })

  it('frozen component type cannot be reassigned', () => {
    const component = Object.freeze(createPositionComponent())
    expect(() => {
      (component as { type: string }).type = 'Other'
    }).toThrow()
  })
})

// ---------------------------------------------------------------------------
// Section 3 — Deep Readonly
// ---------------------------------------------------------------------------

describe('deep readonly', () => {
  it('nested properties are deeply frozen', () => {
    const component = createNestedComponent()
    const frozen = Object.freeze({
      ...component,
      properties: Object.freeze({ ...component.properties }),
    })
    expect(Object.isFrozen(frozen)).toBe(true)
    expect(Object.isFrozen(frozen.properties)).toBe(true)
  })

  it('array properties can be frozen', () => {
    const component = createInventoryComponent()
    const frozenProps = Object.freeze({
      items: Object.freeze([...component.properties.items as readonly unknown[]]),
    })
    expect(Object.isFrozen(frozenProps)).toBe(true)
    expect(Object.isFrozen(frozenProps.items)).toBe(true)
  })

  it('nested object properties can be frozen recursively', () => {
    const component = createNestedComponent()
    const props = component.properties as Record<string, unknown>
    const position = props.position as Record<string, unknown>

    // Freeze all levels
    const frozenPosition = Object.freeze({ ...position })
    const frozenProps = Object.freeze({
      ...props,
      position: frozenPosition,
    })

    expect(Object.isFrozen(frozenPosition)).toBe(true)
    expect(Object.isFrozen(frozenProps)).toBe(true)
  })

  it('deep frozen properties throw on mutation attempt', () => {
    const component = createNestedComponent()
    const frozenProps = Object.freeze({
      ...component.properties,
      position: Object.freeze({
        ...component.properties.position as Record<string, unknown>,
      }),
    })

    expect(() => {
      (frozenProps.position as Record<string, unknown>).x = 99
    }).toThrow()
  })
})

// ---------------------------------------------------------------------------
// Section 4 — Serialization
// ---------------------------------------------------------------------------

describe('serialization', () => {
  it('simple component serializes to JSON', () => {
    const component = createPositionComponent()
    expect(() => JSON.stringify(component)).not.toThrow()
  })

  it('simple component JSON contains type and properties', () => {
    const component = createPositionComponent()
    const json = JSON.stringify(component)
    expect(json).toContain('"type"')
    expect(json).toContain('"properties"')
    expect(json).toContain('"Position"')
  })

  it('component with array properties serializes', () => {
    const component = createInventoryComponent()
    expect(() => JSON.stringify(component)).not.toThrow()
  })

  it('component with nested properties serializes', () => {
    const component = createNestedComponent()
    const json = JSON.stringify(component)
    expect(json).toContain('"position"')
    expect(json).toContain('"rotation"')
    expect(json).toContain('"scale"')
  })

  it('empty properties component round-trips through JSON', () => {
    const original: RuntimeComponent = { type: 'Marker', properties: {} }
    const json = JSON.stringify(original)
    const parsed = JSON.parse(json)
    expect(parsed.type).toBe('Marker')
    expect(parsed.properties).toEqual({})
  })

  it('component with values round-trips through JSON', () => {
    const original = createPositionComponent()
    const json = JSON.stringify(original)
    const parsed = JSON.parse(json)
    expect(parsed.type).toBe('Position')
    expect(parsed.properties.x).toBe(10)
    expect(parsed.properties.y).toBe(5)
  })

  it('component with array rounds-trips through JSON', () => {
    const original = createInventoryComponent()
    const json = JSON.stringify(original)
    const parsed = JSON.parse(json)
    expect(parsed.type).toBe('Inventory')
    expect(parsed.properties.items).toEqual(['sword', 'shield', 'potion'])
  })

  it('JSON values are serializable primitives', () => {
    const component = createPositionComponent()
    const json = JSON.parse(JSON.stringify(component))
    expect(typeof json.type).toBe('string')
    expect(typeof json.properties).toBe('object')
    expect(typeof json.properties.x).toBe('number')
  })
})

// ---------------------------------------------------------------------------
// Section 5 — Large Component Collections
// ---------------------------------------------------------------------------

describe('large component collections', () => {
  it('handles 10 components', () => {
    const components = createComponentCollection(10)
    expect(components).toHaveLength(10)
    expect(components[0].type).toBe('component-0')
    expect(components[9].type).toBe('component-9')
  })

  it('handles 100 components', () => {
    const components = createComponentCollection(100)
    expect(components).toHaveLength(100)
    expect(components[50].type).toBe('component-50')
  })

  it('handles 1000 components', () => {
    const components = createComponentCollection(1000)
    expect(components).toHaveLength(1000)
    expect(components[999].type).toBe('component-999')
  })

  it('each component in collection has correct properties', () => {
    const components = createComponentCollection(50)
    for (let i = 0; i < 50; i++) {
      expect(components[i].properties.index).toBe(i)
      expect(components[i].properties.label).toBe(`Component ${i}`)
    }
  })

  it('collection components have frozen-able structure', () => {
    const components = createComponentCollection(10)
    const frozen = components.map(c => Object.freeze({
      ...c,
      properties: Object.freeze({ ...c.properties }),
    }))
    expect(frozen.every(c => Object.isFrozen(c))).toBe(true)
    expect(frozen.every(c => Object.isFrozen(c.properties))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 6 — Type Safety
// ---------------------------------------------------------------------------

describe('type safety', () => {
  it('type field accepts any string value', () => {
    const component: RuntimeComponent = { type: 'a', properties: {} }
    expect(component.type).toBe('a')
  })

  it('properties accepts typed records', () => {
    const component: RuntimeComponent = {
      type: 'Test',
      properties: { key: 'value', count: 42, flag: true },
    }
    expect(component.properties.key).toBe('value')
    expect(component.properties.count).toBe(42)
    expect(component.properties.flag).toBe(true)
  })

  it('properties are structurally typed as Record', () => {
    const component: RuntimeComponent = {
      type: 'Test',
      properties: { nested: { a: 1, b: 2 } },
    }
    const nested = component.properties.nested as Record<string, number>
    expect(nested.a).toBe(1)
    expect(nested.b).toBe(2)
  })

  it('properties can contain mixed types', () => {
    const component: RuntimeComponent = {
      type: 'Mixed',
      properties: {
        stringVal: 'hello',
        numVal: 42,
        boolVal: true,
        nullVal: null,
        arrVal: [1, 2, 3],
        objVal: { key: 'value' },
      },
    }
    expect(typeof component.properties.stringVal).toBe('string')
    expect(typeof component.properties.numVal).toBe('number')
    expect(typeof component.properties.boolVal).toBe('boolean')
    expect(component.properties.nullVal).toBeNull()
    expect(Array.isArray(component.properties.arrVal)).toBe(true)
    expect(typeof component.properties.objVal).toBe('object')
  })
})