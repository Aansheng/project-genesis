import type { PromptAssemblySnapshot } from './PromptAssemblySnapshot'
import type { PromptAssemblySnapshotBuilder } from './PromptAssemblySnapshotBuilder'
import type { StrategySelectionMetadata } from './StrategySelectionMetadata'
import type { PromptAssemblyPlan } from './PromptAssemblyPlan'
import type { PromptAssemblyPlanDiff } from './PromptAssemblyPlanDiff'

/**
 * DefaultPromptAssemblySnapshotBuilder — default implementation of PromptAssemblySnapshotBuilder.
 *
 * Reads the following known promptAssembly metadata fields by key:
 * - strategy (object with name field)
 * - strategySelection (StrategySelectionMetadata)
 * - strategyRendered (string)
 * - strategyModule (string)
 * - strategyModuleRendered (string)
 * - plan (PromptAssemblyPlan)
 * - optimizedPlan (PromptAssemblyPlan)
 * - planDiff (PromptAssemblyPlanDiff)
 * - planRendered (string)
 *
 * Each field is independently read and type-safe coerced. Unknown fields
 * are silently ignored.
 *
 * Properties:
 * - Pure: same metadata always produces same snapshot
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies the input metadata
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 *
 * Foundation only — not consumed by PromptBuilder yet.
 */
export class DefaultPromptAssemblySnapshotBuilder implements PromptAssemblySnapshotBuilder {
  build(metadata: Record<string, unknown>): PromptAssemblySnapshot {
    const snapshot: Record<string, unknown> = {}

    // strategy — extract name from { name: string } object
    const strategy = metadata.strategy
    if (this.isStrategy(strategy)) {
      snapshot.strategy = strategy.name
    }

    // strategySelection — StrategySelectionMetadata
    const strategySelection = metadata.strategySelection
    if (this.isStrategySelectionMetadata(strategySelection)) {
      snapshot.strategySelection = strategySelection
    }

    // strategyRendered — string
    if (typeof metadata.strategyRendered === 'string' && metadata.strategyRendered.length > 0) {
      snapshot.strategyRendered = metadata.strategyRendered
    }

    // strategyModule — string
    if (typeof metadata.strategyModule === 'string' && metadata.strategyModule.length > 0) {
      snapshot.strategyModule = metadata.strategyModule
    }

    // strategyModuleRendered — string
    if (typeof metadata.strategyModuleRendered === 'string' && metadata.strategyModuleRendered.length > 0) {
      snapshot.strategyModuleRendered = metadata.strategyModuleRendered
    }

    // plan — PromptAssemblyPlan
    const plan = metadata.plan
    if (this.isPromptAssemblyPlan(plan)) {
      snapshot.plan = plan
    }

    // optimizedPlan — PromptAssemblyPlan
    const optimizedPlan = metadata.optimizedPlan
    if (this.isPromptAssemblyPlan(optimizedPlan)) {
      snapshot.optimizedPlan = optimizedPlan
    }

    // planDiff — PromptAssemblyPlanDiff
    const planDiff = metadata.planDiff
    if (this.isPromptAssemblyPlanDiff(planDiff)) {
      snapshot.planDiff = planDiff
    }

    // planRendered — string
    if (typeof metadata.planRendered === 'string' && metadata.planRendered.length > 0) {
      snapshot.planRendered = metadata.planRendered
    }

    return snapshot as unknown as PromptAssemblySnapshot
  }

  /**
   * Type-narrowing guard: checks if a value is a strategy object with a name field.
   */
  private isStrategy(value: unknown): value is { name: string } {
    return (
      value !== null &&
      typeof value === 'object' &&
      'name' in value &&
      typeof (value as Record<string, unknown>).name === 'string'
    )
  }

  /**
   * Type-narrowing guard: checks if a value is a StrategySelectionMetadata.
   */
  private isStrategySelectionMetadata(value: unknown): value is StrategySelectionMetadata {
    if (value === null || typeof value !== 'object') return false
    const obj = value as Record<string, unknown>
    return (
      typeof obj.selected === 'string' &&
      Array.isArray(obj.candidates) &&
      obj.candidates.every(
        (c: unknown) =>
          c !== null &&
          typeof c === 'object' &&
          'strategy' in (c as Record<string, unknown>) &&
          typeof (c as Record<string, unknown>).strategy === 'string' &&
          'score' in (c as Record<string, unknown>) &&
          typeof (c as Record<string, unknown>).score === 'number',
      )
    )
  }

  /**
   * Type-narrowing guard: checks if a value is a PromptAssemblyPlan.
   */
  private isPromptAssemblyPlan(value: unknown): value is PromptAssemblyPlan {
    if (value === null || typeof value !== 'object') return false
    const obj = value as Record<string, unknown>
    if (!Array.isArray(obj.priorities)) return false
    return obj.priorities.every(
      (p: unknown) =>
        p !== null &&
        typeof p === 'object' &&
        'section' in (p as Record<string, unknown>) &&
        typeof (p as Record<string, unknown>).section === 'string' &&
        'priority' in (p as Record<string, unknown>) &&
        typeof (p as Record<string, unknown>).priority === 'number',
    )
  }

  /**
   * Type-narrowing guard: checks if a value is a PromptAssemblyPlanDiff.
   */
  private isPromptAssemblyPlanDiff(value: unknown): value is PromptAssemblyPlanDiff {
    if (value === null || typeof value !== 'object') return false
    const obj = value as Record<string, unknown>
    if (!Array.isArray(obj.added) || !Array.isArray(obj.removed) || !Array.isArray(obj.changed)) {
      return false
    }
    return (
      obj.added.every((s: unknown) => typeof s === 'string') &&
      obj.removed.every((s: unknown) => typeof s === 'string') &&
      obj.changed.every(
        (c: unknown) =>
          c !== null &&
          typeof c === 'object' &&
          'section' in (c as Record<string, unknown>) &&
          typeof (c as Record<string, unknown>).section === 'string' &&
          'before' in (c as Record<string, unknown>) &&
          typeof (c as Record<string, unknown>).before === 'number' &&
          'after' in (c as Record<string, unknown>) &&
          typeof (c as Record<string, unknown>).after === 'number',
      )
    )
  }
}