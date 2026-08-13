/**
 * DefaultSemanticWorldGenerator — default implementation of SemanticWorldGenerator.
 *
 * Converts a PromptAssemblyDomainModel into a GameWorldModel using deterministic
 * rule-based semantic synthesis. The world type is derived from the overview
 * title via keyword matching, and default entities are generated based on the
 * determined world type.
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
 * Default entities per world type:
 * - farm:       player, merchant, wheat-field, harvest-quest
 * - rpg:        player, villager, quest-giver, enemy
 * - platformer: player, terrain, enemy
 * - survival:   player, resource, enemy
 * - sandbox:    player
 *
 * Design:
 * - Pure: no side effects, no I/O, no external calls
 * - Stateless: no internal state between generates
 * - Deterministic: same input always produces same output
 * - Immutable: all outputs are deeply frozen
 * - Defensive: safe extraction, no assumptions about input shape
 */
import type { PromptAssemblyDomainModel } from '../observatory/domain'
import type {
  GameWorldModel,
  GameWorldEntity,
  WorldType,
  EntityCategory,
} from '@genesis/shared'
import type { SemanticWorldGenerator } from './SemanticWorldGenerator'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A template entry for a default entity. */
interface EntityTemplate {
  readonly id: string
  readonly category: EntityCategory
  readonly name: string
}

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

/**
 * Default entity templates per world type.
 *
 * Each world type has a predefined set of entities that represent the
 * core gameplay participants for that genre. These are foundational
 * templates, not AI-generated content.
 */
function getDefaultEntities(): Readonly<Record<WorldType, readonly EntityTemplate[]>> {
  const farm: readonly EntityTemplate[] = Object.freeze([
    Object.freeze({ id: 'player', category: 'player' as EntityCategory, name: 'Player' }),
    Object.freeze({ id: 'merchant', category: 'npc' as EntityCategory, name: 'Merchant' }),
    Object.freeze({ id: 'wheat-field', category: 'terrain' as EntityCategory, name: 'Wheat Field' }),
    Object.freeze({ id: 'harvest-quest', category: 'quest' as EntityCategory, name: 'Harvest Quest' }),
  ])

  const platformer: readonly EntityTemplate[] = Object.freeze([
    Object.freeze({ id: 'player', category: 'player' as EntityCategory, name: 'Player' }),
    Object.freeze({ id: 'terrain', category: 'terrain' as EntityCategory, name: 'Terrain' }),
    Object.freeze({ id: 'enemy', category: 'enemy' as EntityCategory, name: 'Enemy' }),
  ])

  const rpg: readonly EntityTemplate[] = Object.freeze([
    Object.freeze({ id: 'player', category: 'player' as EntityCategory, name: 'Player' }),
    Object.freeze({ id: 'villager', category: 'npc' as EntityCategory, name: 'Villager' }),
    Object.freeze({ id: 'quest-giver', category: 'quest' as EntityCategory, name: 'Quest Giver' }),
    Object.freeze({ id: 'enemy', category: 'enemy' as EntityCategory, name: 'Enemy' }),
  ])

  const survival: readonly EntityTemplate[] = Object.freeze([
    Object.freeze({ id: 'player', category: 'player' as EntityCategory, name: 'Player' }),
    Object.freeze({ id: 'resource', category: 'item' as EntityCategory, name: 'Resource' }),
    Object.freeze({ id: 'enemy', category: 'enemy' as EntityCategory, name: 'Enemy' }),
  ])

  const sandbox: readonly EntityTemplate[] = Object.freeze([
    Object.freeze({ id: 'player', category: 'player' as EntityCategory, name: 'Player' }),
  ])

  return Object.freeze<Record<WorldType, readonly EntityTemplate[]>>({
    farm,
    platformer,
    rpg,
    survival,
    sandbox,
  })
}

// ---------------------------------------------------------------------------
// DefaultSemanticWorldGenerator
// ---------------------------------------------------------------------------

/**
 * DefaultSemanticWorldGenerator — default implementation of SemanticWorldGenerator.
 *
 * Pure. Stateless. Deterministic. Rule-based.
 */
export class DefaultSemanticWorldGenerator implements SemanticWorldGenerator {
  /**
   * Generate a GameWorldModel from a PromptAssemblyDomainModel.
   *
   * Uses rule-based world type detection and default entity templates.
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

    // Generate entities for the detected world type
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
   *
   * Uses a forward-compatible pattern to extract a "title" field from
   * the overview section. If the title contains known keywords, the
   * corresponding world type is returned.
   *
   * Falls back to DEFAULT_WORLD_TYPE when:
   * - No overview section is present
   * - No title can be extracted
   * - Title doesn't match any known keyword
   */
  private detectWorldType(model: PromptAssemblyDomainModel): WorldType {
    const overview = model.overview

    if (overview === undefined || overview === null) {
      return DEFAULT_WORLD_TYPE
    }

    // Forward-compatible title extraction (same pattern as DefaultGameDslBuilder)
    const overviewRecord = overview as unknown as Readonly<Record<string, unknown>>
    const title = overviewRecord.title

    if (typeof title !== 'string' || title.length === 0) {
      return DEFAULT_WORLD_TYPE
    }

    return this.matchWorldType(title)
  }

  /**
   * Match a title string against known world type keywords.
   *
   * Performs case-insensitive keyword matching. The first matching
   * keyword determines the world type.
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
   * Generate entities for the given world type.
   *
   * Returns frozen entities from the default entity templates.
   * Each entity is a frozen GameWorldEntity with id, category, and name.
   */
  private generateEntities(worldType: WorldType): readonly GameWorldEntity[] {
    const templates = getDefaultEntities()[worldType]

    if (!templates || templates.length === 0) {
      return Object.freeze([])
    }

    return Object.freeze(
      templates.map(template => this.createEntity(template)),
    )
  }

  /**
   * Create a single GameWorldEntity from an entity template.
   */
  private createEntity(template: EntityTemplate): GameWorldEntity {
    return Object.freeze({
      id: template.id,
      category: template.category,
      name: template.name,
    })
  }

  // -------------------------------------------------------------------------
  // Private — Empty Model
  // -------------------------------------------------------------------------

  /**
   * Create an empty GameWorldModel.
   *
   * Used when the input is invalid or empty.
   */
  private createEmptyModel(): GameWorldModel {
    return Object.freeze({
      worldType: DEFAULT_WORLD_TYPE,
      entities: Object.freeze([]),
    })
  }
}