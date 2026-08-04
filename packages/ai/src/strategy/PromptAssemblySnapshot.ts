import type { StrategySelectionMetadata } from './StrategySelectionMetadata'
import type { PromptAssemblyPlan } from './PromptAssemblyPlan'
import type { PromptAssemblyPlanDiff } from './PromptAssemblyPlanDiff'

/**
 * PromptAssemblySnapshot — unified diagnostics snapshot for prompt assembly.
 *
 * Consolidates all prompt assembly diagnostic data into a single structure.
 * Individual metadata fields (strategy, plan, optimizedPlan, planDiff, etc.)
 * are sourced from the metadata.promptAssembly namespace during the build
 * process.
 *
 * This snapshot enables downstream consumers (observers, loggers, debug UIs)
 * to inspect the full state of prompt assembly in a single, well-defined
 * shape, without needing to understand the individual metadata field names.
 *
 * All fields are optional — the snapshot will only contain fields that were
 * populated during the build.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Pure data: no methods, no behavior
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 * - Extensible: new fields can be added without breaking changes
 */
export interface PromptAssemblySnapshot {
  /** Name of the selected strategy (e.g., "create", "query") */
  readonly strategy?: string

  /** Full strategy selection metadata with candidates and scores */
  readonly strategySelection?: StrategySelectionMetadata

  /** Rendered strategy description string */
  readonly strategyRendered?: string

  /** Raw strategy module output string */
  readonly strategyModule?: string

  /** Rendered strategy module description string */
  readonly strategyModuleRendered?: string

  /** Original PromptAssemblyPlan from the planner */
  readonly plan?: PromptAssemblyPlan

  /** Optimized PromptAssemblyPlan from the optimizer */
  readonly optimizedPlan?: PromptAssemblyPlan

  /** Diff between original and optimized plans */
  readonly planDiff?: PromptAssemblyPlanDiff

  /** Human-readable plan rendering string */
  readonly planRendered?: string
}