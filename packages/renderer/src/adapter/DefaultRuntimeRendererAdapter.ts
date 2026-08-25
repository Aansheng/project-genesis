/**
 * DefaultRuntimeRendererAdapter — the default implementation of
 * RuntimeRendererAdapter.
 *
 * Mapping rules:
 *   - Entity.id              → RenderEntity.id         (preserved verbatim)
 *   - Entity.type            → RenderEntity.type       (preserved verbatim)
 *   - semantic.name          → RenderEntity.semanticName (when present)
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
import { isPositionComponent, isVelocityComponent } from '@genesis/shared'
import type { RenderWorld, RenderEntity, RenderPosition } from '../model'
import { EMPTY_RENDER_WORLD } from '../model'
import type { RuntimeRendererAdapter } from './RuntimeRendererAdapter'

const SEMANTIC_COMPONENT_TYPE = 'semantic'

export class DefaultRuntimeRendererAdapter implements RuntimeRendererAdapter {
  adapt(world: World): RenderWorld {
    if (!world || !Array.isArray(world.entities)) {
      return EMPTY_RENDER_WORLD
    }

    const entities: RenderEntity[] = []

    for (const entity of world.entities) {
      if (!entity) continue

      const position = this.extractPosition(entity)
      const semanticName = this.extractSemanticName(entity)
      const velocity = entity.components?.find(isVelocityComponent)?.properties
      const presentationState = entity.type === 'player'
        ? velocity && velocity.y !== 0 ? 'jump' : velocity && velocity.x !== 0 ? 'run' : 'idle'
        : undefined

      entities.push(
        Object.freeze({
          id: entity.id,
          type: entity.type,
          ...(semanticName ? { semanticName } : {}),
          ...(position ? { position } : {}),
          ...(velocity ? { velocity: Object.freeze({ ...velocity }) } : {}),
          ...(presentationState ? { presentationState } : {}),
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

  private extractSemanticName(
    entity: World['entities'][number]
  ): string | undefined {
    for (const component of entity.components ?? []) {
      if (component.type !== SEMANTIC_COMPONENT_TYPE) continue
      const name = component.properties.name
      if (typeof name !== 'string' || !name.trim()) return undefined
      return name.trim()
    }

    return undefined
  }
}
