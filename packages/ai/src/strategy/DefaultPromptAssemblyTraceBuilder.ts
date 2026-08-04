import type { PromptAssemblyTrace } from './PromptAssemblyTrace'
import type { PromptAssemblyTraceBuilder } from './PromptAssemblyTraceBuilder'

/**
 * DefaultPromptAssemblyTraceBuilder — default implementation of
 * PromptAssemblyTraceBuilder.
 *
 * Reads the following known promptAssembly metadata fields by key:
 * - strategy (object with name field)
 * - strategySelection (object with selected and candidates fields)
 * - plan (object with priorities array)
 * - optimizedPlan (object with priorities array)
 * - planDiff (object with added, removed, changed arrays)
 * - snapshot (object)
 * - inspector (object with strategy and sections fields)
 * - inspectorRendered (string)
 * - inspectorExported (string)
 *
 * Each field is independently read and type-safe coerced. Unknown fields
 * are silently ignored.
 *
 * Properties:
 * - Pure: same metadata always produces same trace
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies the input metadata
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 *
 * Foundation only — not consumed by PromptBuilder yet.
 */
export class DefaultPromptAssemblyTraceBuilder implements PromptAssemblyTraceBuilder {
  build(metadata: Record<string, unknown>): PromptAssemblyTrace {
    const trace: Record<string, unknown> = {}

    // strategy — extract from { name: string } object
    const strategy = metadata.strategy
    if (this.isObjectWithName(strategy)) {
      trace.strategy = strategy
    }

    // strategySelection — object with selected and candidates
    const strategySelection = metadata.strategySelection
    if (this.isStrategySelectionLike(strategySelection)) {
      trace.strategySelection = strategySelection
    }

    // plan — object with priorities array
    const plan = metadata.plan
    if (this.isPlanLike(plan)) {
      trace.plan = plan
    }

    // optimizedPlan — object with priorities array
    const optimizedPlan = metadata.optimizedPlan
    if (this.isPlanLike(optimizedPlan)) {
      trace.optimizedPlan = optimizedPlan
    }

    // planDiff — object with added, removed, changed arrays
    const planDiff = metadata.planDiff
    if (this.isPlanDiffLike(planDiff)) {
      trace.planDiff = planDiff
    }

    // snapshot — object
    const snapshot = metadata.snapshot
    if (this.isNonEmptyObject(snapshot)) {
      trace.snapshot = snapshot
    }

    // inspector — object with strategy and sections
    const inspector = metadata.inspector
    if (this.isInspectorLike(inspector)) {
      trace.inspector = inspector
    }

    // inspectorRendered — string
    if (typeof metadata.inspectorRendered === 'string' && metadata.inspectorRendered.length > 0) {
      trace.inspectorRendered = metadata.inspectorRendered
    }

    // inspectorExported — string
    if (typeof metadata.inspectorExported === 'string' && metadata.inspectorExported.length > 0) {
      trace.inspectorExported = metadata.inspectorExported
    }

    return trace as unknown as PromptAssemblyTrace
  }

  /**
   * Type-narrowing guard: checks if a value is an object with a name field.
   */
  private isObjectWithName(value: unknown): value is { name: string } {
    return (
      value !== null &&
      typeof value === 'object' &&
      'name' in value &&
      typeof (value as Record<string, unknown>).name === 'string'
    )
  }

  /**
   * Type-narrowing guard: checks if a value resembles StrategySelectionMetadata.
   */
  private isStrategySelectionLike(value: unknown): value is { selected: string; candidates: Array<{ strategy: string; score: number }> } {
    if (value === null || typeof value !== 'object') return false
    const obj = value as Record<string, unknown>
    return (
      typeof obj.selected === 'string' &&
      Array.isArray(obj.candidates)
    )
  }

  /**
   * Type-narrowing guard: checks if a value resembles a PromptAssemblyPlan.
   */
  private isPlanLike(value: unknown): value is { priorities: Array<{ section: string; priority: number }> } {
    if (value === null || typeof value !== 'object') return false
    return Array.isArray((value as Record<string, unknown>).priorities)
  }

  /**
   * Type-narrowing guard: checks if a value resembles a PromptAssemblyPlanDiff.
   */
  private isPlanDiffLike(value: unknown): value is { added: string[]; removed: string[]; changed: Array<{ section: string; before: number; after: number }> } {
    if (value === null || typeof value !== 'object') return false
    const obj = value as Record<string, unknown>
    return (
      Array.isArray(obj.added) &&
      Array.isArray(obj.removed) &&
      Array.isArray(obj.changed)
    )
  }

  /**
   * Type-narrowing guard: checks if a value is a non-null, non-array object.
   */
  private isNonEmptyObject(value: unknown): value is Record<string, unknown> {
    return (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.keys(value).length > 0
    )
  }

  /**
   * Type-narrowing guard: checks if a value resembles a PromptInspector.
   */
  private isInspectorLike(value: unknown): value is { strategy?: string; sections: Array<{ title: string; content: unknown }> } {
    if (value === null || typeof value !== 'object') return false
    const obj = value as Record<string, unknown>
    return (
      'sections' in obj &&
      Array.isArray(obj.sections)
    )
  }
}