/**
 * DefaultWorldTemplateCatalog — the default implementation of
 * WorldTemplateCatalog.
 *
 * Provides rich, deterministic entity templates for each WorldType.
 * Each template defines a fixed set of GameWorldEntities that represent
 * the core gameplay participants for that genre.
 *
 * Templates:
 *   - farm:       8 entities (player, merchant, farmer, barn, wheat-field,
 *                 corn-field, storage, harvest-quest)
 *   - rpg:        9 entities (player, villager, merchant, quest-giver,
 *                 enemy, boss, town, forest, main-quest)
 *   - platformer: 7 entities (player, terrain, platform, enemy, collectible,
 *                 goal, checkpoint)
 *   - survival:   5 entities (player, resource, tree, stone, enemy,
 *                 campfire)
 *   - sandbox:    1 entity (player)
 *
 * Design:
 * - Stateless: no mutable state between lookups
 * - Deterministic: same world type always returns the same template
 * - Immutable: all templates and entities are deeply frozen
 * - Rule-based: no AI, no LLM, no generation logic
 */
import type { WorldType, GameWorldEntity } from '@genesis/shared'
import type { WorldTemplate } from './WorldTemplate'
import type { WorldTemplateCatalog } from './WorldTemplateCatalog'

function createEntity(
  id: string,
  category: GameWorldEntity['category'],
  name: string,
): GameWorldEntity {
  return Object.freeze({ id, category, name })
}

function createTemplate(
  worldType: WorldType,
  entities: readonly GameWorldEntity[],
): WorldTemplate {
  return Object.freeze({
    worldType,
    entities: Object.freeze(entities),
  })
}

export class DefaultWorldTemplateCatalog implements WorldTemplateCatalog {
  // ─── Template Definitions ──────────────────────────────────────────

  private readonly farmTemplate: WorldTemplate = createTemplate('farm', [
    createEntity('player', 'player', 'Player'),
    createEntity('merchant', 'npc', 'Merchant'),
    createEntity('farmer', 'npc', 'Farmer'),
    createEntity('barn', 'building', 'Barn'),
    createEntity('wheat-field', 'terrain', 'Wheat Field'),
    createEntity('corn-field', 'terrain', 'Corn Field'),
    createEntity('storage', 'building', 'Storage'),
    createEntity('harvest-quest', 'quest', 'Harvest Quest'),
  ])

  private readonly rpgTemplate: WorldTemplate = createTemplate('rpg', [
    createEntity('player', 'player', 'Player'),
    createEntity('villager', 'npc', 'Villager'),
    createEntity('merchant', 'npc', 'Merchant'),
    createEntity('quest-giver', 'quest', 'Quest Giver'),
    createEntity('enemy', 'enemy', 'Enemy'),
    createEntity('boss', 'enemy', 'Boss'),
    createEntity('town', 'building', 'Town'),
    createEntity('forest', 'terrain', 'Forest'),
    createEntity('main-quest', 'quest', 'Main Quest'),
  ])

  private readonly platformerTemplate: WorldTemplate = createTemplate('platformer', [
    createEntity('player', 'player', 'Player'),
    createEntity('terrain', 'terrain', 'Terrain'),
    createEntity('platform', 'terrain', 'Platform'),
    createEntity('enemy', 'enemy', 'Enemy'),
    createEntity('collectible', 'item', 'Coin'),
    createEntity('goal', 'item', 'Goal'),
    createEntity('checkpoint', 'item', 'Checkpoint'),
  ])

  private readonly survivalTemplate: WorldTemplate = createTemplate('survival', [
    createEntity('player', 'player', 'Player'),
    createEntity('resource', 'item', 'Resource'),
    createEntity('tree', 'terrain', 'Tree'),
    createEntity('stone', 'terrain', 'Stone'),
    createEntity('enemy', 'enemy', 'Enemy'),
    createEntity('campfire', 'item', 'Campfire'),
  ])

  private readonly sandboxTemplate: WorldTemplate = createTemplate('sandbox', [
    createEntity('player', 'player', 'Player'),
  ])

  // ─── Template Map ──────────────────────────────────────────────────

  private readonly templates: Readonly<Record<WorldType, WorldTemplate>> =
    Object.freeze({
      farm: this.farmTemplate,
      rpg: this.rpgTemplate,
      platformer: this.platformerTemplate,
      survival: this.survivalTemplate,
      sandbox: this.sandboxTemplate,
    })

  // ─── Public API ─────────────────────────────────────────────────────

  /**
   * Retrieve the WorldTemplate for the given WorldType.
   *
   * Every WorldType is guaranteed to have a template.
   *
   * @param worldType — the semantic genre of the game world
   * @returns Frozen WorldTemplate with entity definitions
   */
  getTemplate(worldType: WorldType): WorldTemplate {
    return this.templates[worldType]
  }
}
