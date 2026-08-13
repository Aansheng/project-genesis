/**
 * PositionComponent — verifies the Position component type, factory, and type guard.
 *
 * WO-S8-011 — Position Component Foundation
 * Architecture version v1.70
 *
 * Design:
 * - Foundation only — no movement logic, no physics, no gameplay systems
 * - All instances are deeply frozen and immutable
 * - Same inputs always produce identical outputs
 * - Framework-independent, Runtime-independent
 */

import { describe, it, expect } from 'vitest'
import type { RuntimeComponent } from '../RuntimeComponent'
import {
  POSITION_COMPONENT_TYPE,
  createPositionComponent,
  isPositionComponent,
} from '../components'
import type { PositionComponent } from '../components'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a basic PositionComponent at origin. */
function buildOriginComponent(): PositionComponent {
  return createPositionComponent(0, 0)
}

/** Build a PositionComponent at positive coordinates. */
function buildPositiveComponent(): PositionComponent {
  return createPositionComponent(10, 20)
}

/** Build a PositionComponent at negative coordinates. */
function buildNegativeComponent(): PositionComponent {
  return createPositionComponent(-5, -15)
}

/** Build a PositionComponent using large coordinates. */
function buildLargeCoordinateComponent(): PositionComponent {
  return createPositionComponent(999999, 888888)
}

/** Build a PositionComponent using floating point values. */
function buildFloatingPointComponent(): PositionComponent {
  return createPositionComponent(3.14, 2.718)
}

// ---------------------------------------------------------------------------
// Section 1 — Construction
// ---------------------------------------------------------------------------

describe('construction', () => {
  it('creates PositionComponent at origin', () => {
    const comp = buildOriginComponent()
    expect(comp).toBeDefined()
    expect(comp.type).toBe(POSITION_COMPONENT_TYPE)
    expect(comp.properties.x).toBe(0)
    expect(comp.properties.y).toBe(0)
  })

  it('creates PositionComponent at positive coordinates', () => {
    const comp = buildPositiveComponent()
    expect(comp.properties.x).toBe(10)
    expect(comp.properties.y).toBe(20)
  })

  it('creates PositionComponent with correct type string', () => {
    const comp = buildPositiveComponent()
    expect(comp.type).toBe('position')
  })

  it('creates PositionComponent with properties field', () => {
    const comp = buildPositiveComponent()
    expect(comp).toHaveProperty('properties')
    expect(comp.properties).toHaveProperty('x')
    expect(comp.properties).toHaveProperty('y')
  })

  it('POSITION_COMPONENT_TYPE is the string "position"', () => {
    expect(POSITION_COMPONENT_TYPE).toBe('position')
  })
})

// ---------------------------------------------------------------------------
// Section 2 — Type Guard
// ---------------------------------------------------------------------------

describe('type guard', () => {
  it('returns true for a valid PositionComponent', () => {
    const comp: RuntimeComponent = createPositionComponent(5, 10)
    expect(isPositionComponent(comp)).toBe(true)
  })

  it('returns false for a component with different type', () => {
    const comp: RuntimeComponent = {
      type: 'health',
      properties: { current: 100, max: 100 },
    }
    expect(isPositionComponent(comp)).toBe(false)
  })

  it('returns false for a component with "Position" (capitalized)', () => {
    const comp: RuntimeComponent = {
      type: 'Position',
      properties: { x: 1, y: 2 },
    }
    expect(isPositionComponent(comp)).toBe(false)
  })

  it('returns false for an empty component', () => {
    const comp: RuntimeComponent = {
      type: '',
      properties: {},
    }
    expect(isPositionComponent(comp)).toBe(false)
  })

  it('narrows type correctly within if block', () => {
    const comp: RuntimeComponent = createPositionComponent(7, 8)
    if (isPositionComponent(comp)) {
      // TypeScript narrows `comp` to PositionComponent here
      expect(comp.properties.x).toBe(7)
      expect(comp.properties.y).toBe(8)
    }
  })
})

// ---------------------------------------------------------------------------
// Section 3 — Serialization
// ---------------------------------------------------------------------------

describe('serialization', () => {
  it('origin component serializes to JSON', () => {
    const comp = buildOriginComponent()
    expect(() => JSON.stringify(comp)).not.toThrow()
  })

  it('positive component serializes to JSON', () => {
    const comp = buildPositiveComponent()
    expect(() => JSON.stringify(comp)).not.toThrow()
  })

  it('JSON round-trip preserves type and coordinates', () => {
    const comp = buildPositiveComponent()
    const json = JSON.parse(JSON.stringify(comp))
    expect(json.type).toBe('position')
    expect(json.properties.x).toBe(10)
    expect(json.properties.y).toBe(20)
  })

  it('JSON round-trip preserves negative coordinates', () => {
    const comp = buildNegativeComponent()
    const json = JSON.parse(JSON.stringify(comp))
    expect(json.properties.x).toBe(-5)
    expect(json.properties.y).toBe(-15)
  })

  it('JSON round-trip preserves large coordinates', () => {
    const comp = buildLargeCoordinateComponent()
    const json = JSON.parse(JSON.stringify(comp))
    expect(json.properties.x).toBe(999999)
    expect(json.properties.y).toBe(888888)
  })

  it('JSON round-trip preserves floating point values', () => {
    const comp = buildFloatingPointComponent()
    const json = JSON.parse(JSON.stringify(comp))
    expect(json.properties.x).toBe(3.14)
    expect(json.properties.y).toBe(2.718)
  })
})

// ---------------------------------------------------------------------------
// Section 4 — Immutability
// ---------------------------------------------------------------------------

describe('immutability', () => {
  it('root object is frozen', () => {
    const comp = buildPositiveComponent()
    expect(Object.isFrozen(comp)).toBe(true)
  })

  it('properties object is frozen', () => {
    const comp = buildPositiveComponent()
    expect(Object.isFrozen(comp.properties)).toBe(true)
  })

  it('type field cannot be reassigned (strict mode)', () => {
    const comp = buildPositiveComponent()
    expect(() => {
      // @ts-expect-error — testing runtime behavior of readonly field
      comp.type = 'changed'
    }).toThrow()
  })

  it('properties x cannot be reassigned (strict mode)', () => {
    const comp = buildPositiveComponent()
    expect(() => {
      // @ts-expect-error — testing runtime behavior of readonly field
      comp.properties.x = 999
    }).toThrow()
  })

  it('properties y cannot be reassigned (strict mode)', () => {
    const comp = buildPositiveComponent()
    expect(() => {
      // @ts-expect-error — testing runtime behavior of readonly field
      comp.properties.y = 999
    }).toThrow()
  })

  it('readonly prevents mutation at type level (compile-time check)', () => {
    const comp = buildPositiveComponent()
    // These lines would fail at compile time if uncommented:
    // comp.type = 'changed'        // Error: readonly
    // comp.properties.x = 999      // Error: readonly
    // comp.properties.y = 999      // Error: readonly
    expect(comp.properties.x).toBe(10)
    expect(comp.properties.y).toBe(20)
  })
})

// ---------------------------------------------------------------------------
// Section 5 — Deep Freeze
// ---------------------------------------------------------------------------

describe('deep freeze', () => {
  it('origin component is deeply frozen', () => {
    const comp = buildOriginComponent()
    expect(Object.isFrozen(comp)).toBe(true)
    expect(Object.isFrozen(comp.properties)).toBe(true)
  })

  it('positive component is deeply frozen', () => {
    const comp = buildPositiveComponent()
    expect(Object.isFrozen(comp)).toBe(true)
    expect(Object.isFrozen(comp.properties)).toBe(true)
  })

  it('negative component is deeply frozen', () => {
    const comp = buildNegativeComponent()
    expect(Object.isFrozen(comp)).toBe(true)
    expect(Object.isFrozen(comp.properties)).toBe(true)
  })

  it('large coordinate component is deeply frozen', () => {
    const comp = buildLargeCoordinateComponent()
    expect(Object.isFrozen(comp)).toBe(true)
    expect(Object.isFrozen(comp.properties)).toBe(true)
  })

  it('floating point component is deeply frozen', () => {
    const comp = buildFloatingPointComponent()
    expect(Object.isFrozen(comp)).toBe(true)
    expect(Object.isFrozen(comp.properties)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 6 — Determinism
// ---------------------------------------------------------------------------

describe('determinism', () => {
  it('same inputs produce identical output (origin)', () => {
    const a = createPositionComponent(0, 0)
    const b = createPositionComponent(0, 0)
    expect(a).toEqual(b)
  })

  it('same inputs produce identical output (positive)', () => {
    const a = createPositionComponent(10, 20)
    const b = createPositionComponent(10, 20)
    expect(a).toEqual(b)
  })

  it('same inputs produce identical output (negative)', () => {
    const a = createPositionComponent(-5, -15)
    const b = createPositionComponent(-5, -15)
    expect(a).toEqual(b)
  })

  it('same inputs produce identical output (large)', () => {
    const a = createPositionComponent(999999, 888888)
    const b = createPositionComponent(999999, 888888)
    expect(a).toEqual(b)
  })

  it('same inputs produce identical output (floating point)', () => {
    const a = createPositionComponent(3.14, 2.718)
    const b = createPositionComponent(3.14, 2.718)
    expect(a).toEqual(b)
  })

  it('different inputs produce different output', () => {
    const a = createPositionComponent(1, 2)
    const b = createPositionComponent(3, 4)
    expect(a).not.toEqual(b)
  })
})

// ---------------------------------------------------------------------------
// Section 7 — Negative Coordinates
// ---------------------------------------------------------------------------

describe('negative coordinates', () => {
  it('supports negative x value', () => {
    const comp = createPositionComponent(-100, 0)
    expect(comp.properties.x).toBe(-100)
    expect(comp.properties.y).toBe(0)
  })

  it('supports negative y value', () => {
    const comp = createPositionComponent(0, -200)
    expect(comp.properties.x).toBe(0)
    expect(comp.properties.y).toBe(-200)
  })

  it('supports both negative x and y', () => {
    const comp = createPositionComponent(-50, -75)
    expect(comp.properties.x).toBe(-50)
    expect(comp.properties.y).toBe(-75)
  })

  it('negative coordinates are frozen', () => {
    const comp = createPositionComponent(-1, -1)
    expect(Object.isFrozen(comp)).toBe(true)
    expect(Object.isFrozen(comp.properties)).toBe(true)
  })

  it('negative coordinates survive JSON round-trip', () => {
    const comp = createPositionComponent(-99, -199)
    const json = JSON.parse(JSON.stringify(comp))
    expect(json.properties.x).toBe(-99)
    expect(json.properties.y).toBe(-199)
  })
})

// ---------------------------------------------------------------------------
// Section 8 — Large Coordinates
// ---------------------------------------------------------------------------

describe('large coordinates', () => {
  it('supports x value in hundred-thousands', () => {
    const comp = createPositionComponent(500000, 0)
    expect(comp.properties.x).toBe(500000)
  })

  it('supports y value in hundred-thousands', () => {
    const comp = createPositionComponent(0, 750000)
    expect(comp.properties.y).toBe(750000)
  })

  it('supports both coordinates in hundred-thousands', () => {
    const comp = createPositionComponent(999999, 888888)
    expect(comp.properties.x).toBe(999999)
    expect(comp.properties.y).toBe(888888)
  })

  it('supports large negative coordinates', () => {
    const comp = createPositionComponent(-500000, -750000)
    expect(comp.properties.x).toBe(-500000)
    expect(comp.properties.y).toBe(-750000)
  })

  it('large coordinates survive JSON round-trip', () => {
    const comp = createPositionComponent(999999, 888888)
    const json = JSON.parse(JSON.stringify(comp))
    expect(json.properties.x).toBe(999999)
    expect(json.properties.y).toBe(888888)
  })

  it('large coordinates are frozen', () => {
    const comp = createPositionComponent(999999, 888888)
    expect(Object.isFrozen(comp)).toBe(true)
    expect(Object.isFrozen(comp.properties)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 9 — Floating Point Values
// ---------------------------------------------------------------------------

describe('floating point values', () => {
  it('supports decimal x coordinate', () => {
    const comp = createPositionComponent(1.5, 0)
    expect(comp.properties.x).toBe(1.5)
  })

  it('supports decimal y coordinate', () => {
    const comp = createPositionComponent(0, 2.75)
    expect(comp.properties.y).toBe(2.75)
  })

  it('supports pi and e approximations', () => {
    const comp = createPositionComponent(3.14159, 2.71828)
    expect(comp.properties.x).toBe(3.14159)
    expect(comp.properties.y).toBe(2.71828)
  })

  it('supports very small decimals', () => {
    const comp = createPositionComponent(0.001, 0.0001)
    expect(comp.properties.x).toBe(0.001)
    expect(comp.properties.y).toBe(0.0001)
  })

  it('supports negative floating point', () => {
    const comp = createPositionComponent(-1.5, -3.14)
    expect(comp.properties.x).toBe(-1.5)
    expect(comp.properties.y).toBe(-3.14)
  })

  it('floating point values survive JSON round-trip', () => {
    const comp = createPositionComponent(1.5, 2.75)
    const json = JSON.parse(JSON.stringify(comp))
    expect(json.properties.x).toBe(1.5)
    expect(json.properties.y).toBe(2.75)
  })

  it('floating point values are frozen', () => {
    const comp = createPositionComponent(1.5, 2.75)
    expect(Object.isFrozen(comp)).toBe(true)
    expect(Object.isFrozen(comp.properties)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Section 10 — Type Exports
// ---------------------------------------------------------------------------

describe('type exports', () => {
  it('PositionComponent type is exported', () => {
    const comp: PositionComponent = createPositionComponent(1, 2)
    expect(comp.type).toBe('position')
  })

  it('POSITION_COMPONENT_TYPE is exported', () => {
    expect(POSITION_COMPONENT_TYPE).toBeDefined()
    expect(POSITION_COMPONENT_TYPE).toBe('position')
  })

  it('createPositionComponent is exported', () => {
    expect(createPositionComponent).toBeDefined()
    expect(typeof createPositionComponent).toBe('function')
  })

  it('isPositionComponent is exported', () => {
    expect(isPositionComponent).toBeDefined()
    expect(typeof isPositionComponent).toBe('function')
  })

  it('works with RuntimeComponent from shared package', () => {
    // Verify PositionComponent satisfies RuntimeComponent contract
    const runtimeComp: RuntimeComponent = createPositionComponent(0, 0)
    expect(runtimeComp.type).toBe('position')
    expect(runtimeComp.properties).toBeDefined()
  })
})