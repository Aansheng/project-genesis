/**
 * RenderEntity — a lightweight representation of a runtime entity
 * for the rendering layer.
 *
 * Properties:
 *   - `id`: unique entity identifier (mirrors Runtime Entity.id)
 *   - `type`: entity type string (mirrors Runtime Entity.type)
 *   - `semanticName`: optional semantic name projected from the Runtime
 *     semantic component for role-aware visual selection
 *   - `position`: optional 2D spatial position (when PositionComponent exists)
 *
 * Constraints (WO-S9-002, WO-S9-003):
 *   - No components
 *   - No runtime system references
 *   - Foundation only
 */

import type { RenderPosition } from './RenderPosition'
import type { AssetVisualState, VisualDirection } from '@genesis/shared'

export interface RenderEntity {
  readonly id: string
  readonly type: string
  readonly semanticName?: string
  readonly position?: RenderPosition
  readonly velocity?: Readonly<{ x: number; y: number }>
  readonly presentationState?: AssetVisualState
  /** Runtime-derived four-way direction for a top-down Player presentation. */
  readonly presentationDirection?: VisualDirection
}
