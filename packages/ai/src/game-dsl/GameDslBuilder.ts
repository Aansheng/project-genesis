/**
 * GameDslBuilder — converts PromptAssemblyDomainModel to GameDsl.
 *
 * Provides the first transformation path between the Domain Model and
 * Game DSL layers. This builder is the bridge that converts typed domain
 * model sections into declarative Entity-Component DSL structures.
 *
 * This is NOT game generation. This is structure generation.
 * Each section in the domain model maps to one Game DSL entity with
 * a MetadataComponent tracking its source section.
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
import type { PromptAssemblyDomainModel } from '../observatory/domain'
import type { GameDsl } from '@genesis/shared'

export interface GameDslBuilder {
  /**
   * Build a GameDsl from a typed PromptAssemblyDomainModel.
   *
   * Accepts the typed domain model and produces a declarative GameDsl
   * with one entity per available section. Missing or undefined sections
   * are omitted from the output.
   *
   * @param domainModel — typed PromptAssemblyDomainModel
   * @returns Frozen GameDsl with world and entities
   */
  build(domainModel: PromptAssemblyDomainModel): GameDsl
}