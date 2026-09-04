/**
 * GameWorldModel — semantic game world contracts.
 *
 * Defines the first domain-level game concepts. These types describe a game
 * world in semantic terms: what kind of world it is (worldType), what entities
 * exist (entities), and what category each entity belongs to.
 *
 * This is a CONTRACTS-FIRST model — no AI generation, no Runtime systems,
 * no Renderer integration, no gameplay execution. The only behavior here is
 * the pure, bounded mapping from world type to the shared spatial mode.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Serializable: all types are JSON-serializable primitives
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - Runtime-independent: no Runtime type imports
 * - UI-independent: no ViewModel or UI type imports
 * - Extensible: future fields can be added without breaking changes
 * - Bounded behavior only: no methods, systems, or gameplay logic
 */

// ---------------------------------------------------------------------------
// WorldType
// ---------------------------------------------------------------------------

/**
 * WorldType — the semantic genre of a game world.
 *
 * Describes what kind of game world this is. Each value represents a
 * distinct game genre with different implied mechanics and entity roles.
 *
 * Current members:
 * - 'farm'       — agricultural / life simulation (e.g., Stardew Valley)
 * - 'platformer' — side-scrolling or 2D action platform (e.g., Super Mario)
 * - 'rpg'        — role-playing game (e.g., The Witcher, Skyrim)
 * - 'survival'   — resource-gathering survival (e.g., Minecraft Survival)
 * - 'sandbox'    — open-ended creative sandbox (e.g., Minecraft Creative)
 */
export type WorldType =
  | 'farm'
  | 'platformer'
  | 'rpg'
  | 'survival'
  | 'sandbox'

// ---------------------------------------------------------------------------
// WorldSpatialMode
// ---------------------------------------------------------------------------

/**
 * WorldSpatialMode — the bounded spatial presentation shared by motion and
 * visual composition.
 *
 * This is intentionally smaller than a camera or genre system. It describes
 * how the current world should read visually; Runtime geometry remains the
 * authority for positions, bounds, and collision.
 */
export type WorldSpatialMode = 'side-view' | 'top-down'

/**
 * Resolve the current generic spatial presentation from semantic world type.
 *
 * Only Survival has measured top-down behavior today. Other world types keep
 * the established side-view fallback until a separate product measurement
 * authorizes another mapping.
 */
export function resolveWorldSpatialMode(
  worldType: WorldType | null | undefined,
): WorldSpatialMode {
  return worldType === 'survival' ? 'top-down' : 'side-view'
}

// ---------------------------------------------------------------------------
// EntityCategory
// ---------------------------------------------------------------------------

/**
 * EntityCategory — the semantic role of a game world entity.
 *
 * Describes what role an entity plays in the game world. Each category
 * implies different behaviors, interactions, and rendering concerns.
 *
 * Current members:
 * - 'player'    — the user-controlled character
 * - 'npc'       — non-player character (friendly or neutral)
 * - 'enemy'     - hostile entity
 * - 'terrain'   - static world geometry (trees, rocks, water, ground)
 * - 'building'  - constructed structure (house, farm, wall, gate)
 * - 'item'      - collectible or usable object
 * - 'quest'     - quest marker or objective trigger
 */
export type EntityCategory =
  | 'player'
  | 'npc'
  | 'enemy'
  | 'terrain'
  | 'building'
  | 'item'
  | 'quest'

// ---------------------------------------------------------------------------
// GameplayEntityRole
// ---------------------------------------------------------------------------

/**
 * GameplayEntityRole — the bounded gameplay capability eligibility derived
 * from trusted semantic composition.
 *
 * This is deliberately smaller than an entity ontology or a free-form tag
 * list. It separates the current RPG interaction functions from the
 * human-readable archetype name:
 * - quest-acceptor — may accept the current RPG quest
 * - quest-objective — may receive the current RPG completion consequence
 */
export type GameplayEntityRole = 'quest-acceptor' | 'quest-objective'

export function isGameplayEntityRole(value: unknown): value is GameplayEntityRole {
  return value === 'quest-acceptor' || value === 'quest-objective'
}

// ---------------------------------------------------------------------------
// GameWorldEntity
// ---------------------------------------------------------------------------

/**
 * GameWorldEntity — a single entity in a semantic game world model.
 *
 * Entities are the primary actors and objects in the game world.
 * Each entity has an identifier, a semantic category, and a
 * human-readable name.
 *
 * The category determines the entity's role in the game world.
 * The name is a human-readable label (e.g., "Villager", "Oak Tree",
 * "Iron Sword"). The id is a machine-readable identifier.
 */
export interface GameWorldEntity {
  /** Machine-readable entity identifier. */
  readonly id: string

  /** Semantic category — determines the entity's role in the world. */
  readonly category: EntityCategory

  /** Human-readable entity name (e.g., "Villager", "Oak Tree"). */
  readonly name: string
}

/**
 * Resolve the current bounded gameplay eligibility from semantic identity.
 *
 * The resolver is Genesis-owned and deterministic. Provider/design `role`
 * strings are intentionally not consulted, so they remain candidate metadata
 * rather than live gameplay authority. Origins converge: a CreateWorld RPG
 * entity and the same semantic entity added through World Evolution receive
 * the same role.
 */
export function resolveGameplayEntityRole(
  worldType: WorldType,
  entity: Pick<GameWorldEntity, 'category' | 'name'>,
): GameplayEntityRole | undefined {
  if (worldType !== 'rpg' || entity.category !== 'quest') return undefined
  const normalizedName = entity.name.trim().toLowerCase().replace(/[\s_-]+/gu, '')
  if (normalizedName === 'questgiver') {
    return 'quest-acceptor'
  }
  return 'quest-objective'
}

// ---------------------------------------------------------------------------
// GameWorldModel
// ---------------------------------------------------------------------------

/**
 * GameWorldModel — the root semantic game world contract.
 *
 * Describes an entire game world in semantic terms: what kind of world
 * it is (worldType) and what entities exist within it (entities).
 *
 * This is a higher-level abstraction over GameDsl:
 * - GameDsl describes a world in entity-component terms (low-level)
 * - GameWorldModel describes a world in semantic terms (high-level)
 *
 * The two models serve different purposes:
 * - GameDsl is consumed by the Runtime projection (concrete)
 * - GameWorldModel is consumed by AI and game design (semantic)
 */
export interface GameWorldModel {
  /** The semantic genre of this game world. */
  readonly worldType: WorldType

  /** Entities in the world. */
  readonly entities: readonly GameWorldEntity[]
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

/** Default empty game world model — used when no world is defined. */
export const EMPTY_GAME_WORLD_MODEL: GameWorldModel = Object.freeze({
  worldType: 'sandbox',
  entities: Object.freeze([]),
})
