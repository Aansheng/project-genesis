/**
 * IntentRoutingResult — the result of routing a natural language request.
 *
 * Contains the classified route and a confidence score indicating
 * how confident the router is in its classification.
 *
 * Design principles:
 * - Pure: no side effects, no I/O, no external calls
 * - Stateless: no internal state
 * - Immutable: output is always frozen
 * - Serializable: all fields are JSON-serializable primitives
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - Runtime-independent: no Runtime type imports
 * - Renderer-independent: no Renderer type imports
 * - UI-independent: no ViewModel or UI type imports
 */
import type { IntentRoute } from './IntentRoute'

export interface IntentRoutingResult {
  /** The classified route. */
  readonly route: IntentRoute

  /**
   * Confidence score between 0 and 1.
   * - 1.0: definite match (creation keyword + genre keyword both present)
   * - 0.8: strong match (creation keyword only, no genre keyword)
   * - 0.0: unknown (no match)
   */
  readonly confidence: number
}