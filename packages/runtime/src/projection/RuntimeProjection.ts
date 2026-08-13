/**
 * RuntimeProjection — projects a GameDsl onto the Runtime World representation.
 *
 * Provides the first transformation path between the Game DSL declarative
 * model and the Runtime imperative world. This projection converts typed
 * DSL entities into Runtime entities with position defaults and projected
 * RuntimeComponent objects for each DSL component.
 *
 * This is structure projection, not game generation.
 * No AI, no interpretation, no gameplay logic.
 *
 * Design principles:
 * - Pure: no side effects, no I/O, no external calls
 * - Stateless: no internal state between projects
 * - Deterministic: same input always produces same output
 * - Immutable: output is always frozen
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - UI-independent: no ViewModel or UI type imports
 */
import type { GameDsl } from '@genesis/shared'
import type { RuntimeProjectionResult } from './RuntimeProjectionResult'

export interface RuntimeProjection {
  /**
   * Project a GameDsl onto the Runtime world representation.
   *
   * Accepts a declarative GameDsl and produces a RuntimeProjectionResult
   * with a projected world, entity count, and component count.
   *
   * @param dsl — declarative Game DSL
   * @returns Frozen RuntimeProjectionResult with projected world
   */
  project(dsl: GameDsl): RuntimeProjectionResult
}