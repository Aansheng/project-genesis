/**
 * IntentRouter — routes natural language requests into generation intents.
 *
 * This is a pure semantic routing layer. It consumes a raw string input
 * and produces an IntentRoutingResult with a classified route and confidence.
 * No AI, no LLM, no NLP. Rule-based only.
 *
 * Design principles:
 * - Pure: no side effects, no I/O, no external calls
 * - Stateless: no internal state between routes
 * - Deterministic: same input always produces same output
 * - Immutable: output is always frozen
 * - Rule-based: no AI, no LLM, no heuristics
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - Runtime-independent: no Runtime type imports
 * - Renderer-independent: no Renderer type imports
 * - UI-independent: no ViewModel or UI type imports
 */
import type { IntentRoutingResult } from './IntentRoutingResult'

export interface IntentRouter {
  /**
   * Route a natural language input string to an IntentRoutingResult.
   *
   * Uses deterministic rule-based detection to classify the route.
   *
   * @param input — raw user input string
   * @returns IntentRoutingResult with route and confidence
   */
  route(input: string): IntentRoutingResult
}