/**
 * CommandExecutionResult — the result of executing a user command.
 *
 * Contains a success flag and a human-readable message describing
 * the outcome of the command execution.
 *
 * Design principles:
 * - Pure: no side effects, no I/O, no external calls
 * - Immutable: all fields are readonly (via convention)
 * - Serializable: all types are JSON-serializable primitives
 */
export interface CommandExecutionResult {
  /** Whether the command was executed successfully. */
  readonly success: boolean

  /** Human-readable message describing the outcome. */
  readonly message: string

  /** Real summary data available to the Studio activity surface. */
  readonly entityCount?: number
  readonly generationDiagnostics?: import('@genesis/ai').GameWorldGenerationDiagnostics
  readonly gameplayDiagnostics?: import('@genesis/ai').GameplayGenerationDiagnostics
  readonly gameplaySpecification?: import('@genesis/shared').GameplaySpecification
  readonly semanticWorld?: import('@genesis/shared').GameWorldModel
  readonly evolutionPlan?: import('@genesis/ai').WorldEvolutionPlanResult
}
