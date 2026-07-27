import type { SemanticContext } from './SemanticContext'
import type { IntentResult } from '../intent/IntentResult'
import type { EntityResult } from '../entity/EntityResult'

/**
 * SemanticContextBuilder — interface for constructing SemanticContext from
 * intent and entity analysis results.
 *
 * The SemanticContextBuilder combines independently-produced analysis results
 * into a unified SemanticContext. It performs no inference, no modification,
 * and no filtering — only pure composition.
 *
 * Design principles:
 * - Pure function: same inputs always produce same output
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No dependencies on Planner, Runtime, Provider, or Pipeline
 * - No I/O, no LLM, no side effects
 *
 * @see DefaultSemanticContextBuilder — default implementation
 */
export interface SemanticContextBuilder {
  /**
   * Build a SemanticContext from optional intent and entity results.
   *
   * @param intent — Optional IntentResult from IntentAnalyzer
   * @param entity — Optional EntityResult from EntityAnalyzer
   * @returns A new SemanticContext combining the provided analysis results
   */
  build(intent?: IntentResult, entity?: EntityResult): SemanticContext
}