import type { GameWorldModel } from '@genesis/shared'
import type { WorldLayout } from './WorldLayout'

export interface WorldLayoutGenerator {
  generate(world: GameWorldModel): WorldLayout
}
