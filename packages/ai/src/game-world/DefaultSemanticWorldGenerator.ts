/**
 * DefaultSemanticWorldGenerator — default implementation of SemanticWorldGenerator.
 *
 * Converts a PromptAssemblyDomainModel into a GameWorldModel using deterministic
 * rule-based semantic synthesis. The world type is derived from the overview
 * title via keyword matching, and default entities are generated using a
 * WorldTemplateCatalog.
 *
 * This is NOT AI generation. This is deterministic, rule-based synthesis.
 * No LLM, no gameplay logic, no interpretation.
 *
 * World type detection (from overview title):
 * - Contains "farm"      → 'farm'
 * - Contains "rpg"       → 'rpg'
 * - Contains "platform"  → 'platformer'
 * - Contains "survival"  → 'survival'
 * - Otherwise            → 'sandbox'
 *
 * Entity generation via WorldTemplateCatalog:
 * - farm:       8 entities (player, merchant, farmer, barn, wheat-field, corn-field, storage, harvest-quest)
 * - rpg:        9 entities (player, villager, merchant, quest-giver, enemy, boss, town, forest, main-quest)
 * - platformer: 6 entities (player, terrain, platform, enemy, goal, checkpoint)
 * - survival:   6 entities (player, resource, tree, stone, enemy, campfire)
 * - sandbox:    1 entity (player)
 *
 * Design:
 * - Pure: no side effects, no I/O, no external calls
 * - Stateless: no internal state between generates
 * - Deterministic: same input always produces same output
 * - Immutable: all outputs are deeply frozen
 * - Defensive: safe extraction, no assumptions about input shape
 * - Catalog-driven: entity templates are provided by WorldTemplateCatalog
 */
import type { PromptAssemblyDomainModel } from '../observatory/domain'
import type { GameWorldModel, WorldType, GameWorldEntity } from '@genesis/shared'
import type { SemanticWorldGenerator } from './SemanticWorldGenerator'
import type { WorldTemplateCatalog } from './catalog'
import { DefaultWorldTemplateCatalog } from './catalog'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default world type when no title-based detection matches. */
const DEFAULT_WORLD_TYPE: WorldType = 'sandbox'

/** Keyword-to-world-type mapping for title-based detection. */
const WORLD_TYPE_KEYWORDS: Readonly<Array<{ keyword: string; worldType: WorldType }>> =
  Object.freeze([
    { keyword: 'farm', worldType: 'farm' },
    { keyword: 'rpg', worldType: 'rpg' },
    { keyword: 'platform', worldType: 'platformer' },
    { keyword: 'survival', worldType: 'survival' },
  ])

// ---------------------------------------------------------------------------
// DefaultSemanticWorldGenerator
// ---------------------------------------------------------------------------

/**
 * DefaultSemanticWorldGenerator — default implementation of SemanticWorldGenerator.
 *
 * Pure. Stateless. Deterministic. Rule-based. Catalog-driven.
 */
export class DefaultSemanticWorldGenerator implements SemanticWorldGenerator {
  private readonly catalog: WorldTemplateCatalog

  /**
   * @param catalog — optional WorldTemplateCatalog; defaults to DefaultWorldTemplateCatalog
   */
  constructor(catalog?: WorldTemplateCatalog) {
    this.catalog = catalog ?? new DefaultWorldTemplateCatalog()
  }

  /**
   * Generate a GameWorldModel from a PromptAssemblyDomainModel.
   *
   * Uses rule-based world type detection and the WorldTemplateCatalog
   * for entity generation.
   *
   * @param model — typed PromptAssemblyDomainModel
   * @returns Deeply frozen GameWorldModel
   */
  generate(model: PromptAssemblyDomainModel): GameWorldModel {
    // Handle invalid input
    if (model === undefined || model === null) {
      return this.createEmptyModel()
    }
    if (typeof model !== 'object' || Array.isArray(model)) {
      return this.createEmptyModel()
    }

    // Detect world type from overview title
    const worldType = this.detectWorldType(model)

    // Generate entities for the detected world type via catalog
    const entities = this.generateEntities(worldType)

    // Build and freeze the model
    return Object.freeze({
      worldType,
      entities: Object.freeze(entities),
    })
  }

  // -------------------------------------------------------------------------
  // Private — World Type Detection
  // -------------------------------------------------------------------------

  /**
   * Detect the world type from the domain model's overview section.
   */
  private detectWorldType(model: PromptAssemblyDomainModel): WorldType {
    const overview = model.overview

    if (overview === undefined || overview === null) {
      return DEFAULT_WORLD_TYPE
    }

    // Forward-compatible title extraction
    const overviewRecord = overview as unknown as Readonly<Record<string, unknown>>
    const title = overviewRecord.title

    if (typeof title !== 'string' || title.length === 0) {
      return DEFAULT_WORLD_TYPE
    }

    return this.matchWorldType(title)
  }

  /**
   * Match a title string against known world type keywords.
   */
  private matchWorldType(title: string): WorldType {
    const lowerTitle = title.toLowerCase()

    for (const entry of WORLD_TYPE_KEYWORDS) {
      if (lowerTitle.includes(entry.keyword)) {
        return entry.worldType
      }
    }

    return DEFAULT_WORLD_TYPE
  }

  // -------------------------------------------------------------------------
  // Private — Entity Generation
  // -------------------------------------------------------------------------

  /**
   * Generate entities for the given world type using the catalog.
   *
   * Returns frozen entities from the WorldTemplateCatalog template.
   * Each entity is a frozen GameWorldEntity with id, category, and name.
   */
  private generateEntities(worldType: WorldType): readonly GameWorldEntity[] {
    const template = this.catalog.getTemplate(worldType)

    if (!template || !template.entities || template.entities.length === 0) {
      return Object.freeze([])
    }

    return template.entities
  }

  // -------------------------------------------------------------------------
  // Private — Empty Model
  // -------------------------------------------------------------------------

  /**
   * Create an empty GameWorldModel.
   */
  private createEmptyModel(): GameWorldModel {
    return Object.freeze({
      worldType: DEFAULT_WORLD_TYPE,
      entities: Object.freeze([]),
    })
  }
}