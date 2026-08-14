/**
 * IntentRoute — the semantic route classification for a natural language request.
 *
 * This is a pure semantic type — no Runtime, no Renderer, no DSL, no Planner,
 * no PromptBuilder, no LLM integration.
 *
 * Foundation only.
 *
 * Design principles:
 * - Pure: no side effects, no I/O, no external calls
 * - Stateless: no internal state
 * - Serializable: all values are JSON-serializable primitives
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - Runtime-independent: no Runtime type imports
 * - Renderer-independent: no Renderer type imports
 * - UI-independent: no ViewModel or UI type imports
 */

/**
 * IntentRoute — the classified route for a user's natural language request.
 *
 * Two supported routes:
 * - 'create-world' — the user intends to create a new game world
 * - 'unknown' — the intent cannot be determined
 */
export type IntentRoute = 'create-world' | 'unknown'