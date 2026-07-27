import type { IntentResult } from '../intent/IntentResult'
import type { EntityResult } from '../entity/EntityResult'

/**
 * SemanticContext — unified semantic representation of user input.
 *
 * Combines intent analysis (what the user wants to do) with entity
 * recognition (what objects the user is referring to) into a single
 * immutable data structure.
 *
 * This is the foundation for downstream Planner evolution — instead of
 * receiving raw natural language, the Planner can consume a structured
 * SemanticContext with pre-parsed intent and entity information.
 *
 * Design principles:
 * - Pure immutable data: no methods, no behavior
 * - readonly: immutable by design
 * - Optional fields: intent and entity are independently optional
 * - Minimal: only known, needed fields
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 *
 * @property intent — Analyzed user intentions (optional)
 * @property entity — Recognized entity references (optional)
 */
export interface SemanticContext {
  /** Analyzed user intentions */
  readonly intent?: IntentResult

  /** Recognized entity references */
  readonly entity?: EntityResult
}