import type { EntityType } from './EntityType'

/**
 * Entity — a single recognized entity from user input.
 *
 * Represents a specific entity type that the user mentioned in their natural language input.
 *
 * Design principles:
 * - Pure data: no methods, no behavior
 * - readonly: immutable by design
 * - Minimal: only type discriminator in foundation version
 *
 * @example { type: 'Tree' }
 */
export interface Entity {
  readonly type: EntityType
}