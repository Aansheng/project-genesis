/**
 * EntityVisualCatalog.test.ts — comprehensive test suite for the
 * EntityVisualCatalog (WO-S9-007).
 *
 * Coverage areas:
 *   - All known mappings (player, enemy, merchant, boss)
 *   - Unknown types (fallback to default)
 *   - Default entity visual
 *   - Immutability
 *   - Determinism
 *   - Frozen outputs
 */
import { describe, it, expect } from 'vitest'
import { DefaultEntityVisualCatalog } from '../DefaultEntityVisualCatalog'

function createCatalog(): DefaultEntityVisualCatalog {
  return new DefaultEntityVisualCatalog()
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('Construction', () => {
  it('creates a DefaultEntityVisualCatalog instance', () => {
    const catalog = createCatalog()
    expect(catalog).toBeInstanceOf(DefaultEntityVisualCatalog)
  })
})

describe('player mapping', () => {
  it('returns circle shape', () => {
    const catalog = createCatalog()
    const visual = catalog.getVisual('player')
    expect(visual.shape).toBe('circle')
  })

  it('returns 24x24 dimensions', () => {
    const catalog = createCatalog()
    const visual = catalog.getVisual('player')
    expect(visual.width).toBe(24)
    expect(visual.height).toBe(24)
  })
})

describe('enemy mapping', () => {
  it('returns rectangle shape', () => {
    const catalog = createCatalog()
    const visual = catalog.getVisual('enemy')
    expect(visual.shape).toBe('rectangle')
  })

  it('returns 20x20 dimensions', () => {
    const catalog = createCatalog()
    const visual = catalog.getVisual('enemy')
    expect(visual.width).toBe(20)
    expect(visual.height).toBe(20)
  })
})

describe('merchant mapping', () => {
  it('returns rectangle shape', () => {
    const catalog = createCatalog()
    const visual = catalog.getVisual('merchant')
    expect(visual.shape).toBe('rectangle')
  })

  it('returns 28x20 dimensions', () => {
    const catalog = createCatalog()
    const visual = catalog.getVisual('merchant')
    expect(visual.width).toBe(28)
    expect(visual.height).toBe(20)
  })
})

describe('boss mapping', () => {
  it('returns rectangle shape', () => {
    const catalog = createCatalog()
    const visual = catalog.getVisual('boss')
    expect(visual.shape).toBe('rectangle')
  })

  it('returns 40x40 dimensions', () => {
    const catalog = createCatalog()
    const visual = catalog.getVisual('boss')
    expect(visual.width).toBe(40)
    expect(visual.height).toBe(40)
  })
})

describe('unknown types', () => {
  it('returns default for unknown type', () => {
    const catalog = createCatalog()
    const visual = catalog.getVisual('unknown')
    expect(visual.shape).toBe('rectangle')
    expect(visual.width).toBe(20)
    expect(visual.height).toBe(20)
  })

  it('returns default for empty string', () => {
    const catalog = createCatalog()
    const visual = catalog.getVisual('')
    expect(visual.shape).toBe('rectangle')
    expect(visual.width).toBe(20)
    expect(visual.height).toBe(20)
  })

  it('returns default for null-like type', () => {
    const catalog = createCatalog()
    const visual = catalog.getVisual('null')
    expect(visual.shape).toBe('rectangle')
    expect(visual.width).toBe(20)
    expect(visual.height).toBe(20)
  })
})

describe('immutability', () => {
  it('returned visual definitions are frozen', () => {
    const catalog = createCatalog()
    expect(Object.isFrozen(catalog.getVisual('player'))).toBe(true)
    expect(Object.isFrozen(catalog.getVisual('enemy'))).toBe(true)
    expect(Object.isFrozen(catalog.getVisual('merchant'))).toBe(true)
    expect(Object.isFrozen(catalog.getVisual('boss'))).toBe(true)
    expect(Object.isFrozen(catalog.getVisual('unknown'))).toBe(true)
  })

  it('visual definition properties are readonly', () => {
    const catalog = createCatalog()
    const visual = catalog.getVisual('player')
    expect(() => {
      (visual as { width: number }).width = 999
    }).toThrow()
  })
})

describe('determinism', () => {
  it('same type returns same definition across calls', () => {
    const catalog = createCatalog()

    const v1 = catalog.getVisual('player')
    const v2 = catalog.getVisual('player')

    expect(v1).toBe(v2)
    expect(v1.width).toBe(v2.width)
    expect(v1.height).toBe(v2.height)
    expect(v1.shape).toBe(v2.shape)
  })

  it('same type returns same definition across instances', () => {
    const c1 = createCatalog()
    const c2 = createCatalog()

    expect(c1.getVisual('enemy').width).toBe(c2.getVisual('enemy').width)
    expect(c1.getVisual('enemy').height).toBe(c2.getVisual('enemy').height)
    expect(c1.getVisual('enemy').shape).toBe(c2.getVisual('enemy').shape)
  })
})

describe('all mappings', () => {
  it('all known types return valid visual definitions', () => {
    const catalog = createCatalog()
    const types = ['player', 'enemy', 'merchant', 'boss']

    for (const type of types) {
      const visual = catalog.getVisual(type)
      expect(visual.width).toBeGreaterThan(0)
      expect(visual.height).toBeGreaterThan(0)
      expect(['rectangle', 'circle']).toContain(visual.shape)
    }
  })

  it('no two known types share the exact same visual', () => {
    const catalog = createCatalog()
    const visuals = ['player', 'enemy', 'merchant', 'boss'].map(
      (type) => catalog.getVisual(type),
    )

    for (let i = 0; i < visuals.length; i++) {
      for (let j = i + 1; j < visuals.length; j++) {
        const a = visuals[i]
        const b = visuals[j]
        const sameSize = a.width === b.width && a.height === b.height
        const sameShape = a.shape === b.shape
        // Each type should differ in at least one dimension
        expect(sameSize && sameShape).toBe(false)
      }
    }
  })
})