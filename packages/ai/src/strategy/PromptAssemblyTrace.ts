/**
 * PromptAssemblyTrace — unified trace domain model for prompt assembly.
 *
 * Aggregates all prompt assembly diagnostic artifacts into a single,
 * well-defined structure. This trace object captures the complete
 * prompt assembly narrative:
 *
 * - strategy: which strategy was selected
 * - strategySelection: how strategies were scored
 * - plan: the original assembly plan
 * - optimizedPlan: the optimized plan
 * - planDiff: what changed between original and optimized
 * - snapshot: unified diagnostics snapshot
 * - inspector: structured inspection data
 * - inspectorRendered: human-readable inspector text
 * - inspectorExported: exported inspector representation
 *
 * This trace enables downstream consumers (observers, loggers, debug UIs,
 * timeline tools) to inspect the full prompt assembly lifecycle in a single,
 * well-defined shape, without needing to understand the individual metadata
 * field locations.
 *
 * All fields are optional — the trace will only contain fields that were
 * populated during the build.
 *
 * Design principles:
 * - Immutable: all fields are readonly
 * - Pure data: no methods, no behavior
 * - Independent: no dependencies on Planner, Runtime, Provider, or Pipeline
 * - Extensible: new fields can be added without breaking changes
 */
export interface PromptAssemblyTrace {
  /** Name of the selected strategy (e.g., "create", "query") */
  readonly strategy?: unknown

  /** Strategy selection metadata with candidates and scores */
  readonly strategySelection?: unknown

  /** Original PromptAssemblyPlan from the planner */
  readonly plan?: unknown

  /** Optimized PromptAssemblyPlan from the optimizer */
  readonly optimizedPlan?: unknown

  /** Diff between original and optimized plans */
  readonly planDiff?: unknown

  /** Unified diagnostics snapshot */
  readonly snapshot?: unknown

  /** Structured inspection data from PromptInspector */
  readonly inspector?: unknown

  /** Human-readable inspector text */
  readonly inspectorRendered?: string

  /** Exported inspector representation */
  readonly inspectorExported?: string
}