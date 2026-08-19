import type { GameWorldModel } from '@genesis/shared'
import type { SpatialPosition } from './SpatialPosition'
import type { WorldLayout } from './WorldLayout'
import type { WorldLayoutGenerator } from './WorldLayoutGenerator'

const GROUND_Y = 400
const PLAYER_SPAWN = Object.freeze({ x: 80, y: 300 })

const PLATFORMER_POSITIONS: Readonly<Record<string, SpatialPosition>> = Object.freeze({
  player: PLAYER_SPAWN,
  terrain: Object.freeze({ x: 160, y: GROUND_Y }),
  platform: Object.freeze({ x: 300, y: 320 }),
  enemy: Object.freeze({ x: 380, y: 360 }),
  checkpoint: Object.freeze({ x: 500, y: 320 }),
  goal: Object.freeze({ x: 650, y: 300 }),
})

const GENRE_POSITIONS: Readonly<Record<string, Readonly<Record<string, SpatialPosition>>>> = Object.freeze({
  farm: Object.freeze({
    player: PLAYER_SPAWN,
    barn: Object.freeze({ x: 320, y: 304 }),
    'wheat-field': Object.freeze({ x: 200, y: GROUND_Y }),
    'corn-field': Object.freeze({ x: 520, y: GROUND_Y }),
  }),
  rpg: Object.freeze({
    player: PLAYER_SPAWN,
    town: Object.freeze({ x: 320, y: 304 }),
    forest: Object.freeze({ x: 560, y: GROUND_Y }),
  }),
  survival: Object.freeze({
    player: PLAYER_SPAWN,
    tree: Object.freeze({ x: 360, y: GROUND_Y }),
    stone: Object.freeze({ x: 520, y: GROUND_Y }),
    campfire: Object.freeze({ x: 240, y: 384 }),
  }),
  sandbox: Object.freeze({ player: PLAYER_SPAWN }),
})

const CATEGORY_X: Readonly<Record<string, number>> = Object.freeze({
  npc: 100,
  enemy: 120,
  terrain: 160,
  building: 260,
  item: 360,
  quest: 440,
})

export class DefaultWorldLayoutGenerator implements WorldLayoutGenerator {
  generate(world: GameWorldModel): WorldLayout {
    const entities = Array.isArray(world?.entities) ? world.entities : []
    const positions: Record<string, SpatialPosition> = {}
    const used = new Set<string>()
    const validEntities = entities
      .filter((entity): entity is NonNullable<typeof entity> => Boolean(entity && typeof entity === 'object'))
      .sort((a, b) => String(a.id ?? '').localeCompare(String(b.id ?? '')))

    for (const entity of validEntities) {
      const id = String(entity.id ?? '')
      const position = this.positionFor(world, id, entity.category, used)
      positions[id] = Object.freeze({ ...position })
      used.add(this.key(position))
    }
    return Object.freeze({ positions: Object.freeze(positions) })
  }

  private positionFor(
    world: GameWorldModel,
    id: string,
    category: string,
    used: ReadonlySet<string>,
  ): SpatialPosition {
    if (category === 'player') return PLAYER_SPAWN

    const genrePositions = GENRE_POSITIONS[world.worldType]
    const fixed = (world.worldType === 'platformer' ? PLATFORMER_POSITIONS : genrePositions)?.[id]
    if (fixed) return fixed

    const baseX = CATEGORY_X[category] ?? 520
    const baseY = category === 'building' ? 304 : category === 'item' || category === 'quest' ? 384 : GROUND_Y
    const hash = this.hash(id)
    const step = category === 'building' ? 112 : 72
    const start = Math.floor(hash % 6)

    for (let offset = 0; offset < 100; offset += 1) {
      const slot = (start + offset) % 100
      const position = { x: baseX + slot * step, y: baseY }
      if (!used.has(this.key(position))) return position
    }

    return { x: baseX, y: baseY }
  }

  private hash(value: string): number {
    let hash = 2166136261
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index)
      hash = Math.imul(hash, 16777619)
    }
    return hash >>> 0
  }

  private key(position: SpatialPosition): string {
    return `${position.x}:${position.y}`
  }
}
