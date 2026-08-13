/**
 * SemanticGameDslBuilder — converts GameWorldModel to GameDsl.
 *
 * Provides the first transformation path between the Semantic Game World
 * Model and the Game DSL layers. This builder is the bridge that converts
 * semantic game concepts (world types, entity categories) into declarative
 * Entity-Component DSL structures.
 *
 * This is NOT game generation. This is structure translation.
 * Each GameWorldEntity maps to one EntityDsl with a semantic component
 * preserving the category and name metadata.
 *
 * Design principles:
 * - Pure: no side effects, no I/O, no external calls
 * - Stateless: no internal state between builds
 * - Deterministic: same input always produces same output
 * - Immutable: output is always frozen
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - Runtime-independent: no Runtime type imports
 * - UI-independent: no ViewModel or UI type imports
 */
import type { GameWorldModel, GameDsl } from '@genesis/shared'

export interface SemanticGameDslBuilder {
  /**
   * Build a GameDsl from a semantic GameWorldModel.
   *
   * Accepts a semantic game world model and produces a declarative GameDsl
   * with one entity per GameWorldEntity, each carrying a semantic component
   * preserving category and name metadata.
   *
   * @param world — semantic GameWorldModel
   * @returns Frozen GameDsl with world and projected entities
   */
  build(world: GameWorldModel): GameDsl
}