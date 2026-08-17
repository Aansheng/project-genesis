import type { GameWorldModel } from '@genesis/shared'
import type { SpatialPosition } from './SpatialPosition'
import type { WorldLayout } from './WorldLayout'
import type { WorldLayoutGenerator } from './WorldLayoutGenerator'

const PLATFORMER_POSITIONS: Readonly<Record<string, SpatialPosition>> = Object.freeze({
  player: Object.freeze({ x: 80, y: 300 }),
  terrain: Object.freeze({ x: 160, y: 400 }),
  platform: Object.freeze({ x: 300, y: 320 }),
  enemy: Object.freeze({ x: 380, y: 360 }),
  checkpoint: Object.freeze({ x: 500, y: 320 }),
  goal: Object.freeze({ x: 650, y: 300 }),
})

export class DefaultWorldLayoutGenerator implements WorldLayoutGenerator {
  generate(world: GameWorldModel): WorldLayout {
    const entities = Array.isArray(world?.entities) ? world.entities : []
    const positions: Record<string, SpatialPosition> = {}
    entities.forEach((entity, index) => {
      if (!entity || typeof entity !== 'object') return
      const position = world.worldType === 'platformer'
        ? PLATFORMER_POSITIONS[entity.id] ?? this.genericPosition(index)
        : this.genericPosition(index)
      positions[entity.id] = Object.freeze({ ...position })
    })
    return Object.freeze({ positions: Object.freeze(positions) })
  }

  private genericPosition(index: number): SpatialPosition {
    return { x: 80 + index * 120, y: 80 }
  }
}
