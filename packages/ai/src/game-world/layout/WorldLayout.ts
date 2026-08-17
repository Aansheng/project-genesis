import type { SpatialPosition } from './SpatialPosition'

export interface WorldLayout {
  readonly positions: Readonly<Record<string, SpatialPosition>>
}
