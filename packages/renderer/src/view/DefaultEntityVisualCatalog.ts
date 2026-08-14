/**
 * DefaultEntityVisualCatalog — the default implementation of
 * EntityVisualCatalog.
 *
 * Mappings:
 *   player:   circle,   24×24
 *   enemy:    rectangle, 20×20
 *   merchant: rectangle, 28×20
 *   boss:     rectangle, 40×40
 *   default:  rectangle, 20×20
 *
 * Design principles:
 * - Stateless: no internal state beyond the frozen map
 * - Deterministic: same type → same frozen definition
 * - Immutable: all definitions and the map are deeply frozen
 * - Extensible: new mappings can be added via subclass or wrapper
 * - Fallback: unknown types return a sensible default (20×20 rectangle)
 */
import type { EntityVisualCatalog } from './EntityVisualCatalog'
import type { EntityVisualDefinition } from './EntityVisualDefinition'

/** Default fallback: 20×20 rectangle used when no mapping exists. */
const DEFAULT_VISUAL: EntityVisualDefinition = Object.freeze({
  width: 20,
  height: 20,
  shape: 'rectangle',
})

/** Predefined visual definitions for known entity types. */
const VISUAL_MAP: Readonly<Record<string, EntityVisualDefinition>> = Object.freeze({
  player: Object.freeze<EntityVisualDefinition>({
    width: 24,
    height: 24,
    shape: 'circle',
  }),
  enemy: Object.freeze<EntityVisualDefinition>({
    width: 20,
    height: 20,
    shape: 'rectangle',
  }),
  merchant: Object.freeze<EntityVisualDefinition>({
    width: 28,
    height: 20,
    shape: 'rectangle',
  }),
  boss: Object.freeze<EntityVisualDefinition>({
    width: 40,
    height: 40,
    shape: 'rectangle',
  }),
})

export class DefaultEntityVisualCatalog implements EntityVisualCatalog {
  getVisual(entityType: string): EntityVisualDefinition {
    return VISUAL_MAP[entityType] ?? DEFAULT_VISUAL
  }
}