import type { EntityResult } from './EntityResult'

/**
 * EntityAnalyzer — interface for extracting entity references from natural language input.
 *
 * The EntityAnalyzer is the semantic bridge between natural language
 * and recognized entity types. It produces EntityResult without
 * any dependency on Planner, Runtime, Provider, Intent, or ToolCalling.
 *
 * Foundation only — current implementations must be pure, deterministic,
 * stateless, and side-effect free.
 *
 * @see DefaultEntityAnalyzer — placeholder implementation
 */
export interface EntityAnalyzer {
  /**
   * Analyze natural language input and extract entity references.
   *
   * @param input — The natural language input to analyze
   * @returns EntityResult containing recognized entities
   */
  analyze(input: string): EntityResult
}