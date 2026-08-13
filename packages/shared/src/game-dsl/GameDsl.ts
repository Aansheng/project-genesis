/**
 * GameDsl — root typed contract for the Game DSL.
 *
 * Defines the first typed Game DSL layer. All interfaces describe a game
 * world using an Entity-Component pattern where entities have typed components
 * with arbitrary properties.
 *
 * This is a FOUNDATION model — no Runtime integration, no Renderer
 * integration, no AI generation, no mapping logic.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Serializable: all types are JSON-serializable primitives
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - Runtime-independent: no Runtime type imports
 * - UI-independent: no ViewModel or UI type imports
 * - Extensible: future fields can be added without breaking changes
 * - Types only: no behavior, no methods, no logic
 */

// ---------------------------------------------------------------------------
// ComponentDsl
// ---------------------------------------------------------------------------

/**
 * ComponentDsl — a single component attached to an entity.
 *
 * Components describe the capabilities and state of an entity.
 * Each component has a type and a bag of properties.
 *
 * Properties are `unknown` — they will be typed by future DSL work.
 */
export interface ComponentDsl {
  /** Component type identifier (e.g., "Position", "Health", "AI"). */
  readonly type: string

  /** Component properties — arbitrary key-value bag. */
  readonly properties: Readonly<Record<string, unknown>>
}

// ---------------------------------------------------------------------------
// EntityDsl
// ---------------------------------------------------------------------------

/**
 * EntityDsl — a single entity in the game world.
 *
 * Entities are the primary actors in the world. Each entity has
 * an identifier, a type, and a list of components that define
 * its capabilities and state.
 */
export interface EntityDsl {
  /** Unique entity identifier. */
  readonly id: string

  /** Entity type (e.g., "Guard", "Villager", "Tree"). */
  readonly type: string

  /** Components attached to this entity. */
  readonly components: readonly ComponentDsl[]
}

// ---------------------------------------------------------------------------
// WorldDsl
// ---------------------------------------------------------------------------

/**
 * WorldDsl — the root world definition in the Game DSL.
 *
 * A world has a name and contains entities.
 */
export interface WorldDsl {
  /** Human-readable world name. */
  readonly name: string

  /** Entities in the world. */
  readonly entities: readonly EntityDsl[]
}

// ---------------------------------------------------------------------------
// GameDsl
// ---------------------------------------------------------------------------

/**
 * GameDsl — root Game DSL contract.
 *
 * Represents an entire game world description.
 * This is the entry point for all DSL consumers.
 */
export interface GameDsl {
  /** The world definition — the root container for the game. */
  readonly world: WorldDsl
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

/** Default empty game DSL — used when no world is defined. */
export const EMPTY_GAME_DSL: GameDsl = Object.freeze({
  world: Object.freeze({
    name: '',
    entities: Object.freeze([]),
  }),
})