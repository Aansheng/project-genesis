/**
 * GameIntent — pure semantic model for describing what type of game the user wants.
 *
 * This is a pure semantic layer — no Runtime, no Renderer, no DSL, no Planner,
 * no PromptBuilder, no LLM integration.
 *
 * Foundation only.
 *
 * Design principles:
 * - Pure: no side effects, no I/O, no external calls
 * - Stateless: no internal state
 * - Deterministic: same input always produces same output
 * - Immutable: output is always frozen
 * - Serializable: all types are JSON-serializable primitives
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - Runtime-independent: no Runtime type imports
 * - Renderer-independent: no Renderer type imports
 * - UI-independent: no ViewModel or UI type imports
 */

// ---------------------------------------------------------------------------
// GameGenre
// ---------------------------------------------------------------------------

/**
 * GameGenre — the semantic category of game the user intends to create.
 *
 * Five supported genres:
 * - 'platformer' — Mario-like side-scrolling platform games
 * - 'farm' — Stardew Valley-like farming simulation games
 * - 'rpg' — role-playing games with quests and character progression
 * - 'survival' — resource-gathering survival games
 * - 'sandbox' — open-ended creative sandbox games (default)
 */
export type GameGenre = 'platformer' | 'farm' | 'rpg' | 'survival' | 'sandbox'

// ---------------------------------------------------------------------------
// GameIntent
// ---------------------------------------------------------------------------

/**
 * GameIntent — frozen semantic model describing the user's game intent.
 *
 * Captures the genre classification and title of the intended game.
 * This is a foundational type that will be consumed by SemanticWorldGenerator
 * in a follow-up work order.
 *
 * All fields are readonly. The output is always frozen.
 */
export interface GameIntent {
  /** The detected game genre. */
  readonly genre: GameGenre

  /** The game title extracted from the input, or a fallback. */
  readonly title: string
}