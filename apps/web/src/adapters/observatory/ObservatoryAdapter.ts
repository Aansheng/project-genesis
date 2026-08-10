import type { ObservatoryViewModel } from './ObservatoryViewModel'

/**
 * ObservatoryAdapter — transforms raw Prompt Assembly observatory data
 * into a UI-safe ObservatoryViewModel.
 *
 * The adapter decouples the UI layer from the Prompt Assembly Observability
 * Layer. Components consume the ViewModel directly and never import types
 * from the AI package.
 *
 * Design principles:
 * - Pure: no side effects, no state, no dependencies
 * - Stateless: no mutable fields, no lifecycle
 * - Deterministic: same input always produces same output
 * - Defensive: handles undefined, null, and invalid inputs gracefully
 */
export interface ObservatoryAdapter {
  /**
   * Transform raw observatory data (unknown) into a safe ViewModel.
   *
   * @param observatory - raw data from the Prompt Assembly Observability Layer
   * @returns a fully populated ObservatoryViewModel with safe defaults
   */
  adapt(observatory: unknown): ObservatoryViewModel
}