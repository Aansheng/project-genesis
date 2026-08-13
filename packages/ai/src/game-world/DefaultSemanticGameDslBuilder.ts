/**
 * DefaultSemanticGameDslBuilder — default implementation of SemanticGameDslBuilder.
 *
 * Converts a GameWorldModel into a declarative GameDsl using a 1-to-1
 * semantic mapping. Each GameWorldEntity produces one EntityDsl with:
 * - id: preserved from GameWorldEntity.id
 * - type: derived from GameWorldEntity.category
 * - components: a single "semantic" component preserving category and name
 *
 * World name is derived from the WorldType value:
 * - 'farm'       → 'Farm World'
 * - 'platformer' → 'Platformer World'
 * - 'rpg'        → 'RPG World'
 * - 'survival'   → 'Survival World'
 * - 'sandbox'    → 'Sandbox World'
 *
 * This is structure translation, not game generation.
 * No AI, no logic, no simulation.
 *
 * Mapping rules:
 * - GameWorldModel.worldType → GameDsl.world.name (human-readable format)
 * - Each GameWorldEntity → EntityDsl (id, type, semantic component)
 * - GameWorldEntity.id → EntityDsl.id (preserved)
 * - GameWorldEntity.category → EntityDsl.type (preserved)
 * - Each entity gets a single "semantic" component with:
 *   - properties.category: the entity's category
 *   - properties.name: the entity's human-readable name
 * - Empty world produces a world with zero entities
 *
 * Design:
 * - Pure: no side effects, no I/O, no external calls
 * - Stateless: no internal state between builds
 * - Deterministic: same input always produces same output
 * - Immutable: all outputs are deeply frozen
 * - Defensive: safe extraction, no assumptions about input shape
 */
import type {
  GameDsl,
  GameWorldModel,
  GameWorldEntity,
  WorldDsl,
  EntityDsl,
  ComponentDsl,
} from '@genesis/shared'
import type { SemanticGameDslBuilder } from './SemanticGameDslBuilder'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Mapping from WorldType values to human-readable world names. */
const WORLD_TYPE_NAMES: Readonly<Record<string, string>> = Object.freeze({
  farm: 'Farm World',
  platformer: 'Platformer World',
  rpg: 'RPG World',
  survival: 'Survival World',
  sandbox: 'Sandbox World',
})

/** Fallback world name when worldType is unrecognized. */
const FALLBACK_WORLD_NAME = 'Game World'

/** The component type identifier for semantic metadata. */
const SEMANTIC_COMPONENT_TYPE = 'semantic'

// ---------------------------------------------------------------------------
// DefaultSemanticGameDslBuilder
// ---------------------------------------------------------------------------

/**
 * DefaultSemanticGameDslBuilder — default implementation of SemanticGameDslBuilder.
 *
 * Pure. Stateless. Deterministic.
 */
export class DefaultSemanticGameDslBuilder implements SemanticGameDslBuilder {
  /**
   * Build a GameDsl from a semantic GameWorldModel.
   *
   * @param world — semantic game world model
   * @returns Deeply frozen GameDsl with world and entities
   */
  build(world: GameWorldModel): GameDsl {
    // Handle invalid input
    if (world === undefined || world === null) {
      return this.createEmptyDsl()
    }
    if (typeof world !== 'object' || Array.isArray(world)) {
      return this.createEmptyDsl()
    }

    // Derive world name from worldType
    const worldName = this.deriveWorldName(world)

    // Generate entities from the semantic world model
    const entities = this.generateEntities(world)

    // Build and freeze the world
    const dslWorld: WorldDsl = Object.freeze({
      name: worldName,
      entities: Object.freeze(entities),
    })

    // Build and freeze the game DSL
    return Object.freeze({ world: dslWorld })
  }

  // -------------------------------------------------------------------------
  // Private — World Name Derivation
  // -------------------------------------------------------------------------

  /**
   * Derive the world name from the GameWorldModel's worldType.
   *
   * Uses the WORLD_TYPE_NAMES lookup table to convert the semantic
   * world type into a human-readable world name.
   *
   * Falls back to "Game World" when the worldType is unrecognized
   * or missing.
   */
  private deriveWorldName(world: GameWorldModel): string {
    const worldType = world.worldType

    if (typeof worldType === 'string') {
      const name = WORLD_TYPE_NAMES[worldType]
      if (name !== undefined) {
        return name
      }
    }

    return FALLBACK_WORLD_NAME
  }

  // -------------------------------------------------------------------------
  // Private — Entity Generation
  // -------------------------------------------------------------------------

  /**
   * Generate one EntityDsl per GameWorldEntity in the semantic model.
   *
   * Each entity maps as follows:
   * - GameWorldEntity.id → EntityDsl.id (preserved as string)
   * - GameWorldEntity.category → EntityDsl.type (preserved as string)
   * - A single "semantic" component is created with category and name
   *
   * @param world — semantic game world model
   * @returns Array of frozen EntityDsl objects
   */
  private generateEntities(world: GameWorldModel): readonly EntityDsl[] {
    const entities = world.entities

    if (!Array.isArray(entities) || entities.length === 0) {
      return Object.freeze([])
    }

    const result: EntityDsl[] = []

    for (const entity of entities) {
      if (!entity || typeof entity !== 'object') {
        continue
      }

      result.push(this.createEntityDsl(entity))
    }

    return Object.freeze(result)
  }

  /**
   * Create a single EntityDsl from a GameWorldEntity.
   *
   * Each entity gets:
   * - id: preserved from GameWorldEntity.id
   * - type: derived from GameWorldEntity.category
   * - components: a single semantic component with category and name
   */
  private createEntityDsl(entity: GameWorldEntity): EntityDsl {
    return Object.freeze({
      id: String(entity.id ?? ''),
      type: String(entity.category ?? ''),
      components: Object.freeze([
        this.createSemanticComponent(entity),
      ]),
    })
  }

  // -------------------------------------------------------------------------
  // Private — Semantic Component Creation
  // -------------------------------------------------------------------------

  /**
   * Create a semantic component for a GameWorldEntity.
   *
   * The semantic component preserves the entity's category and
   * human-readable name as metadata. This allows downstream consumers
   * to reconstruct the semantic meaning of the entity after DSL projection.
   *
   * Component structure:
   * - type: "semantic"
   * - properties.category: the entity's category (e.g., "player", "npc")
   * - properties.name: the entity's human-readable name (e.g., "Hero")
   */
  private createSemanticComponent(entity: GameWorldEntity): ComponentDsl {
    return Object.freeze({
      type: SEMANTIC_COMPONENT_TYPE,
      properties: Object.freeze({
        category: entity.category,
        name: entity.name,
      }),
    })
  }

  // -------------------------------------------------------------------------
  // Private — Empty DSL
  // -------------------------------------------------------------------------

  /**
   * Create an empty GameDsl.
   *
   * Used when the input GameWorldModel is invalid or empty.
   */
  private createEmptyDsl(): GameDsl {
    return Object.freeze({
      world: Object.freeze({
        name: '',
        entities: Object.freeze([]),
      }),
    })
  }
}