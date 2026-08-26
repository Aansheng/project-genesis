/**
 * DefaultEntityVisualCatalog — the default implementation of
 * EntityVisualCatalog.
 *
 * Mappings:
 *   player:     circle,   48×48, feet anchored
 *   enemy:      rectangle, 40×48, feet anchored
 *   merchant:   rectangle, 40×48, feet anchored
 *   boss:       rectangle, 72×88, feet anchored
 *   terrain:    rectangle, 64×32  (wide platform)
 *   platform:   rectangle, 96×24  (horizontal platform)
 *   goal:       rectangle, 24×96  (tall flag-style)
 *   checkpoint: rectangle, 16×48  (tall marker)
 *   item:       rectangle, 16×16  (small square)
 *   default:    rectangle, 20×20
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
  anchor: 'top-left',
})

/** Predefined visual definitions for known entity types. */
const VISUAL_MAP: Readonly<Record<string, EntityVisualDefinition>> = Object.freeze({
  player: Object.freeze<EntityVisualDefinition>({
    width: 48,
    height: 48,
    shape: 'circle',
    anchor: 'feet',
  }),
  enemy: Object.freeze<EntityVisualDefinition>({
    width: 40,
    height: 48,
    shape: 'rectangle',
    anchor: 'feet',
  }),
  merchant: Object.freeze<EntityVisualDefinition>({
    width: 44,
    height: 52,
    shape: 'rectangle',
    anchor: 'feet',
  }),
  boss: Object.freeze<EntityVisualDefinition>({
    width: 72,
    height: 88,
    shape: 'rectangle',
    anchor: 'feet',
  }),
  npc: Object.freeze<EntityVisualDefinition>({
    width: 40,
    height: 52,
    shape: 'rectangle',
    anchor: 'feet',
  }),
  animal: Object.freeze<EntityVisualDefinition>({
    width: 40,
    height: 40,
    shape: 'rectangle',
    anchor: 'feet',
  }),
  prop: Object.freeze<EntityVisualDefinition>({
    width: 48,
    height: 48,
    shape: 'rectangle',
    anchor: 'top-left',
  }),
  building: Object.freeze<EntityVisualDefinition>({
    width: 128,
    height: 96,
    shape: 'rectangle',
    anchor: 'top-left',
  }),
  terrain: Object.freeze<EntityVisualDefinition>({
    width: 64,
    height: 32,
    shape: 'rectangle',
    anchor: 'top-left',
  }),
  platform: Object.freeze<EntityVisualDefinition>({
    width: 96,
    height: 24,
    shape: 'rectangle',
    // Runtime Platform collision bounds are centered on PositionComponent.
    // Keep the visual skin on that same coordinate contract.
    anchor: 'center',
  }),
  goal: Object.freeze<EntityVisualDefinition>({
    width: 24,
    height: 96,
    shape: 'rectangle',
  }),
  checkpoint: Object.freeze<EntityVisualDefinition>({
    width: 16,
    height: 48,
    shape: 'rectangle',
  }),
  item: Object.freeze<EntityVisualDefinition>({
    width: 16,
    height: 16,
    shape: 'rectangle',
  }),
})

export class DefaultEntityVisualCatalog implements EntityVisualCatalog {
  getVisual(entityType: string): EntityVisualDefinition {
    return VISUAL_MAP[entityType] ?? DEFAULT_VISUAL
  }
}
