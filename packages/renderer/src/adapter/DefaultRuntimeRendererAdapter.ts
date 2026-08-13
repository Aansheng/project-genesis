/**
 * DefaultRuntimeRendererAdapter — the default implementation of
 * RuntimeRendererAdapter.
 *
 * Mapping rules:
 *   - Entity.id              → RenderEntity.id         (preserved verbatim)
 *   - Entity.type            → RenderEntity.type       (preserved verbatim)
 *   - PositionComponent      → RenderEntity.position   (if present)
 *   - Entity.x / Entity.y    → IGNORED
 *   - Other components       → IGNORED
 *
 * Output guarantees:
 *   - Pure function (no side effects, no state)
 *   - Deterministic (same input → same output, same order)
 *   - Immutable (frozen RenderWorld, frozen entities array, frozen entities)
 *   - Input is never mutated
 */

import type { World } from '@genesis/shared'
import { isPositionComponent } from '@genesis/shared'
import type { RenderWorld, RenderEntity, RenderPosition } from '../model'
import { EMPTY_RENDER_WORLD } from '../model'
import type { RuntimeRendererAdapter } from './RuntimeRendererAdapter'

export class DefaultRuntimeRendererAdapter implements RuntimeRendererAdapter {
  adapt(world: World): RenderWorld {
    if (!world || !Array.isArray(world.entities)) {
      return EMPTY_RENDER_WORLD
    }

    const entities: RenderEntity[] = []

    for (const entity of world.entities) {
      if (!entity) continue

      const position = this.extractPosition(entity)

      entities.push(
        Object.freeze({
          id: entity.id,
          type: entity.type,
          ...(position ? { position } : {}),
        })
      )
    }

    return Object.freeze({
      entities: Object.freeze(entities),
    })
  }

  private extractPosition(
    entity: World['entities'][number]
  ): RenderPosition | undefined {
    if (!entity.components || entity.components.length === 0) {
      return undefined
    }

    for (const component of entity.components) {
      if (isPositionComponent(component)) {
        return Object.freeze({
          x: component.properties.x,
          y: component.properties.y,
        })
      }
    }

    return undefined
  }
}