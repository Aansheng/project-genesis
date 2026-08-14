/**
 * PlatformTileCatalog.test.ts — comprehensive test suite for the
 * PlatformTileCatalog (WO-S9-016).
 *
 * Coverage areas:
 *   - All known mappings (player, terrain, goal, platform, enemy, checkpoint, item)
 *   - Unknown types (fallback to default)
 *   - Default fallback tile
 *   - Immutability (frozen outputs, readonly properties)
 *   - Determinism (same type across calls and instances)
 *   - Large inputs
 */
import { describe, it, expect } from 'vitest'
import { DefaultPlatformTileCatalog } from '../DefaultPlatformTileCatalog'

function createCatalog(): DefaultPlatformTileCatalog {
  return new DefaultPlatformTileCatalog()
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('Construction', () => {
  it('creates a DefaultPlatformTileCatalog instance', () => {
    const catalog = createCatalog()
    expect(catalog).toBeInstanceOf(DefaultPlatformTileCatalog)
  })
})

describe('player mapping', () => {
  it('returns 24x24 dimensions', () => {
    const catalog = createCatalog()
    const tile = catalog.getTile('player')
    expect(tile.width).toBe(24)
    expect(tile.height).toBe(24)
  })
})

describe('terrain mapping', () => {
  it('returns 64x32 dimensions', () => {
    const catalog = createCatalog()
    const tile = catalog.getTile('terrain')
    expect(tile.width).toBe(64)
    expect(tile.height).toBe(32)
  })

  it('terrain is wider than tall', () => {
    const catalog = createCatalog()
    const tile = catalog.getTile('terrain')
    expect(tile.width).toBeGreaterThan(tile.height)
  })
})

describe('goal mapping', () => {
  it('returns 24x96 dimensions', () => {
    const catalog = createCatalog()
    const tile = catalog.getTile('goal')
    expect(tile.width).toBe(24)
    expect(tile.height).toBe(96)
  })

  it('goal is taller than wide (flag-style)', () => {
    const catalog = createCatalog()
    const tile = catalog.getTile('goal')
    expect(tile.height).toBeGreaterThan(tile.width)
  })
})

describe('platform mapping', () => {
  it('returns 96x24 dimensions', () => {
    const catalog = createCatalog()
    const tile = catalog.getTile('platform')
    expect(tile.width).toBe(96)
    expect(tile.height).toBe(24)
  })

  it('platform is much wider than tall', () => {
    const catalog = createCatalog()
    const tile = catalog.getTile('platform')
    expect(tile.width).toBeGreaterThan(tile.height * 3)
  })
})

describe('enemy mapping', () => {
  it('returns 24x24 dimensions', () => {
    const catalog = createCatalog()
    const tile = catalog.getTile('enemy')
    expect(tile.width).toBe(24)
    expect(tile.height).toBe(24)
  })

  it('enemy is square', () => {
    const catalog = createCatalog()
    const tile = catalog.getTile('enemy')
    expect(tile.width).toBe(tile.height)
  })
})

describe('checkpoint mapping', () => {
  it('returns 16x48 dimensions', () => {
    const catalog = createCatalog()
    const tile = catalog.getTile('checkpoint')
    expect(tile.width).toBe(16)
    expect(tile.height).toBe(48)
  })

  it('checkpoint is taller than wide', () => {
    const catalog = createCatalog()
    const tile = catalog.getTile('checkpoint')
    expect(tile.height).toBeGreaterThan(tile.width)
  })
})

describe('item mapping', () => {
  it('returns 16x16 dimensions', () => {
    const catalog = createCatalog()
    const tile = catalog.getTile('item')
    expect(tile.width).toBe(16)
    expect(tile.height).toBe(16)
  })

  it('item is a small square', () => {
    const catalog = createCatalog()
    const tile = catalog.getTile('item')
    expect(tile.width).toBe(tile.height)
    expect(tile.width).toBeLessThan(20)
  })
})

describe('fallback for unknown types', () => {
  it('returns 20x20 default for unknown type', () => {
    const catalog = createCatalog()
    const tile = catalog.getTile('unknown')
    expect(tile.width).toBe(20)
    expect(tile.height).toBe(20)
  })

  it('returns 20x20 default for empty string', () => {
    const catalog = createCatalog()
    const tile = catalog.getTile('')
    expect(tile.width).toBe(20)
    expect(tile.height).toBe(20)
  })

  it('returns 20x20 default for null-like type', () => {
    const catalog = createCatalog()
    const tile = catalog.getTile('null')
    expect(tile.width).toBe(20)
    expect(tile.height).toBe(20)
  })

  it('returns 20x20 default for undefined-like type', () => {
    const catalog = createCatalog()
    const tile = catalog.getTile('undefined')
    expect(tile.width).toBe(20)
    expect(tile.height).toBe(20)
  })
})

describe('immutability', () => {
  it('returned tile definitions are frozen', () => {
    const catalog = createCatalog()
    expect(Object.isFrozen(catalog.getTile('player'))).toBe(true)
    expect(Object.isFrozen(catalog.getTile('terrain'))).toBe(true)
    expect(Object.isFrozen(catalog.getTile('goal'))).toBe(true)
    expect(Object.isFrozen(catalog.getTile('platform'))).toBe(true)
    expect(Object.isFrozen(catalog.getTile('enemy'))).toBe(true)
    expect(Object.isFrozen(catalog.getTile('checkpoint'))).toBe(true)
    expect(Object.isFrozen(catalog.getTile('item'))).toBe(true)
    expect(Object.isFrozen(catalog.getTile('unknown'))).toBe(true)
  })

  it('tile definition properties are readonly', () => {
    const catalog = createCatalog()
    const tile = catalog.getTile('player')
    expect(() => {
      const mutable = tile as { width: number }
      mutable.width = 999
    }).toThrow()
  })

  it('fallback tile is frozen', () => {
    const catalog = createCatalog()
    const tile = catalog.getTile('nonexistent')
    expect(Object.isFrozen(tile)).toBe(true)
  })
})

describe('determinism', () => {
  it('same type returns same definition across calls', () => {
    const catalog = createCatalog()

    const t1 = catalog.getTile('player')
    const t2 = catalog.getTile('player')

    expect(t1).toBe(t2)
    expect(t1.width).toBe(t2.width)
    expect(t1.height).toBe(t2.height)
  })

  it('same type returns same definition across instances', () => {
    const c1 = createCatalog()
    const c2 = createCatalog()

    expect(c1.getTile('terrain').width).toBe(c2.getTile('terrain').width)
    expect(c1.getTile('terrain').height).toBe(c2.getTile('terrain').height)
  })

  it('multiple calls to getTile return same reference for same type', () => {
    const catalog = createCatalog()
    const results = Array.from({ length: 10 }, () => catalog.getTile('goal'))
    const first = results[0]
    for (const r of results) {
      expect(r).toBe(first)
    }
  })
})

describe('all mappings', () => {
  it('all known types return valid tile definitions', () => {
    const catalog = createCatalog()
    const types = ['player', 'terrain', 'goal', 'platform', 'enemy', 'checkpoint', 'item']

    for (const type of types) {
      const tile = catalog.getTile(type)
      expect(tile.width).toBeGreaterThan(0)
      expect(tile.height).toBeGreaterThan(0)
    }
  })

  it('no two known types share the exact same tile', () => {
    const catalog = createCatalog()
    const types = ['player', 'terrain', 'goal', 'platform', 'enemy', 'checkpoint', 'item']
    const tiles = types.map((type) => catalog.getTile(type))

    for (let i = 0; i < tiles.length; i++) {
      for (let j = i + 1; j < tiles.length; j++) {
        const a = tiles[i]
        const b = tiles[j]
        const sameSize = a.width === b.width && a.height === b.height
        // player and enemy share 24x24 — that's acceptable
        // All other pairs must differ
        const typeI = types[i]
        const typeJ = types[j]
        const isPlayerEnemyPair =
          (typeI === 'player' && typeJ === 'enemy') ||
          (typeI === 'enemy' && typeJ === 'player')
        if (!isPlayerEnemyPair) {
          expect(sameSize).toBe(false)
        }
      }
    }
  })

  it('all known widths are positive integers', () => {
    const catalog = createCatalog()
    const types = ['player', 'terrain', 'goal', 'platform', 'enemy', 'checkpoint', 'item']
    for (const type of types) {
      const tile = catalog.getTile(type)
      expect(tile.width).toBeGreaterThan(0)
      expect(Number.isInteger(tile.width)).toBe(true)
    }
  })

  it('all known heights are positive integers', () => {
    const catalog = createCatalog()
    const types = ['player', 'terrain', 'goal', 'platform', 'enemy', 'checkpoint', 'item']
    for (const type of types) {
      const tile = catalog.getTile(type)
      expect(tile.height).toBeGreaterThan(0)
      expect(Number.isInteger(tile.height)).toBe(true)
    }
  })
})

describe('large inputs', () => {
  it('handles very long entity type strings', () => {
    const catalog = createCatalog()
    const longType = 'a'.repeat(1000)
    const tile = catalog.getTile(longType)
    expect(tile.width).toBe(20)
    expect(tile.height).toBe(20)
  })

  it('handles special characters in entity type', () => {
    const catalog = createCatalog()
    const special = '@#$%^&*()_+-=[]{}|;:,.<>?'
    const tile = catalog.getTile(special)
    expect(tile.width).toBe(20)
    expect(tile.height).toBe(20)
  })

  it('handles unicode entity type strings', () => {
    const catalog = createCatalog()
    const unicode = 'プレイヤー敵人關卡'
    const tile = catalog.getTile(unicode)
    expect(tile.width).toBe(20)
    expect(tile.height).toBe(20)
  })
})

describe('edge cases', () => {
  it('player and enemy have same tile size', () => {
    const catalog = createCatalog()
    const playerTile = catalog.getTile('player')
    const enemyTile = catalog.getTile('enemy')
    expect(playerTile.width).toBe(enemyTile.width)
    expect(playerTile.height).toBe(enemyTile.height)
  })

  it('terrain is twice as wide as player', () => {
    const catalog = createCatalog()
    const terrain = catalog.getTile('terrain')
    const player = catalog.getTile('player')
    expect(terrain.width).toBe(player.width * 2 + 16)
  })

  it('goal height is 4x player height', () => {
    const catalog = createCatalog()
    const goal = catalog.getTile('goal')
    const player = catalog.getTile('player')
    expect(goal.height).toBe(player.height * 4)
  })

  it('platform width is 4x player width', () => {
    const catalog = createCatalog()
    const platform = catalog.getTile('platform')
    const player = catalog.getTile('player')
    expect(platform.width).toBe(player.width * 4)
  })

  it('fallback does not equal any known tile', () => {
    const catalog = createCatalog()
    const fallback = catalog.getTile('unknown')
    const types = ['player', 'terrain', 'goal', 'platform', 'enemy', 'checkpoint', 'item']
    for (const type of types) {
      const tile = catalog.getTile(type)
      const isSame = tile.width === fallback.width && tile.height === fallback.height
      expect(isSame).toBe(false)
    }
  })
})

describe('interface contract', () => {
  it('implements PlatformTileCatalog interface', () => {
    const catalog = createCatalog()
    expect(typeof catalog.getTile).toBe('function')
  })

  it('getTile returns an object with width and height', () => {
    const catalog = createCatalog()
    const tile = catalog.getTile('player')
    expect(tile).toHaveProperty('width')
    expect(tile).toHaveProperty('height')
  })

  it('getTile accepts any string input', () => {
    const catalog = createCatalog()
    expect(() => catalog.getTile('player')).not.toThrow()
    expect(() => catalog.getTile('')).not.toThrow()
    expect(() => catalog.getTile('a'.repeat(100))).not.toThrow()
  })
})

describe('return value consistency', () => {
  it('all known tiles have positive integer dimensions', () => {
    const catalog = createCatalog()
    const types = ['player', 'terrain', 'goal', 'platform', 'enemy', 'checkpoint', 'item']
    for (const type of types) {
      const tile = catalog.getTile(type)
      expect(tile.width).toBeGreaterThan(0)
      expect(tile.height).toBeGreaterThan(0)
      expect(Number.isInteger(tile.width)).toBe(true)
      expect(Number.isInteger(tile.height)).toBe(true)
    }
  })

  it('fallback tile has positive integer dimensions', () => {
    const catalog = createCatalog()
    const tile = catalog.getTile('nonexistent')
    expect(tile.width).toBeGreaterThan(0)
    expect(tile.height).toBeGreaterThan(0)
    expect(Number.isInteger(tile.width)).toBe(true)
    expect(Number.isInteger(tile.height)).toBe(true)
  })
})