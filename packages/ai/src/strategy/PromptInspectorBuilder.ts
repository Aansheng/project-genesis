import type { PromptAssemblySnapshot } from './PromptAssemblySnapshot'
import type { PromptInspector } from './PromptInspector'

/**
 * PromptInspectorBuilder — builds a PromptInspector from a PromptAssemblySnapshot.
 *
 * Converts the unified snapshot structure into a human-readable inspection
 * model with labeled sections. Each recognized snapshot field is mapped to
 * a corresponding section with a descriptive title.
 *
 * Design principles:
 * - Pure: same snapshot always produces same inspector
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - No side effects: does not modify the snapshot
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 */
export interface PromptInspectorBuilder {
  /**
   * Build a PromptInspector from a PromptAssemblySnapshot.
   *
   * @param snapshot — The fully populated prompt assembly snapshot
   * @returns A PromptInspector with strategy name and labeled sections
   */
  build(snapshot: PromptAssemblySnapshot): PromptInspector
}