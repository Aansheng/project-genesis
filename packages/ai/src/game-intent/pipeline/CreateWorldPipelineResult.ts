/**
 * CreateWorldPipelineResult — the result of executing a CreateWorldPipeline.
 *
 * Contains the routed intent, the projected Runtime world, and a success flag
 * indicating whether the pipeline completed successfully.
 *
 * Design principles:
 * - Pure: no side effects, no I/O, no external calls
 * - Immutable: all fields are readonly
 * - Serializable: all types are JSON-serializable primitives
 * - Framework-independent: no Vue, Pinia, or web framework imports
 * - Runtime-independent: no Runtime type imports
 * - Renderer-independent: no Renderer type imports
 * - UI-independent: no ViewModel or UI type imports
 */
import type { World } from '@genesis/shared'
import type { GameWorldModel } from '@genesis/shared'
import type { GameWorldGenerationDiagnostics } from '../../game-world/generation'
import type { GameplayGenerationDiagnostics } from '../../gameplay'
import type { GameplaySpecification } from '@genesis/shared'

export interface CreateWorldPipelineResult {
  /**
   * The routed intent string from the IntentRouter.
   * e.g., 'create-world' or 'unknown'.
   */
  readonly route: string

  /**
   * The projected Runtime world.
   * Only valid when success is true. When success is false,
   * this will be an empty World with no entities.
   */
  readonly world: World

  /** The semantic snapshot used to compile this Runtime world. */
  readonly semanticWorld?: GameWorldModel

  /**
   * Whether the pipeline completed successfully.
   * true when the route is 'create-world' and all pipeline steps
   * completed without error.
   */
  readonly success: boolean
  readonly generationDiagnostics?: GameWorldGenerationDiagnostics
  readonly gameplaySpecification?: GameplaySpecification
  readonly gameplayDiagnostics?: GameplayGenerationDiagnostics
}
