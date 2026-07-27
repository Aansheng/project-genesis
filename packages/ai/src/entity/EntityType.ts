/**
 * EntityType — extensible string union representing entity types recognized from user input.
 *
 * Foundation types:
 * - Tree:      A tree entity
 * - Flower:    A flower entity
 * - House:     A house entity
 * - Rock:      A rock entity
 * - Water:     A water entity
 * - Grass:     A grass entity
 * - Character: A character/person entity
 * - Unknown:   Unrecognized entity type
 *
 * Future types must be additive (union extension, never removal).
 */
export type EntityType =
  | 'Tree'
  | 'Flower'
  | 'House'
  | 'Rock'
  | 'Water'
  | 'Grass'
  | 'Character'
  | 'Unknown'