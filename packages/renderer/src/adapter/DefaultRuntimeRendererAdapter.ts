/**
 * DefaultRuntimeRendererAdapter — the default implementation of
 * RuntimeRendererAdapter.
 *
 * Mapping rules:
 *   - Entity.id        → RenderEntity.id      (preserved verbatim)
 *   - Entity.type      → RenderEntity.type    (preserved verbatim)
 *   - Entity.x         → IGNORED
 *   - Entity.y         → IGNORED
 *   - Entity.components → IGNORED
 *
 * Output guarantees:
 *   - Pure function (no side effects, no state)
 *   - Deterministic (same input → same output, same order)
 *   - Immutable (frozen RenderWorld, frozen entities array, frozen entities)
 *   - Input is never mutated
 */

import type { World } from '@genesis/shared'
import type { RenderWorld, RenderEntity } from '../model'
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

      entities.push(
        Object.freeze({
          id: entity.id,
          type: entity.type,
        })
      )
    }

    return Object.freeze({
      entities: Object.freeze(entities),
    })
  }
}