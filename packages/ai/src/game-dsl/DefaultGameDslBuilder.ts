/**
 * DefaultGameDslBuilder — default implementation of GameDslBuilder.
 *
 * Converts a typed PromptAssemblyDomainModel into a declarative GameDsl
 * using a 1-to-1 structural mapping: each available section in the domain
 * model produces one entity with a MetadataComponent tracking its source.
 *
 * This is structure generation, not game generation.
 * No AI, no logic, no simulation.
 *
 * Mapping rules:
 * - World name is derived from domainModel.overview.title (when available)
 *   with fallback to "Untitled World"
 * - One entity per available section (overview, trace, timeline, history,
 *   diff, runtime, eventStream)
 * - Each entity carries a single MetadataComponent with its source section
 * - Missing/undefined sections produce no entity
 * - Empty domain model produces a world with zero entities
 *
 * Design:
 * - Pure: no side effects, no I/O, no external calls
 * - Stateless: no internal state between builds
 * - Deterministic: same input always produces same output
 * - Immutable: all outputs are deeply frozen
 * - Defensive: safe extraction, no assumptions about input shape
 */
import type {
  GameDsl,
  WorldDsl,
  EntityDsl,
  ComponentDsl,
} from '@genesis/shared'
import type { PromptAssemblyDomainModel } from '../observatory/domain'
import type { GameDslBuilder } from './GameDslBuilder'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Fallback world name when overview.title is unavailable. */
const FALLBACK_WORLD_NAME = 'Untitled World'

/** Known section names that can appear in the domain model. */
const SECTION_NAMES = [
  'overview',
  'trace',
  'timeline',
  'history',
  'diff',
  'runtime',
  'eventStream',
] as const

type SectionName = (typeof SECTION_NAMES)[number]

// ---------------------------------------------------------------------------
// DefaultGameDslBuilder
// ---------------------------------------------------------------------------

/**
 * DefaultGameDslBuilder — default implementation of GameDslBuilder.
 *
 * Pure. Stateless. Deterministic.
 */
export class DefaultGameDslBuilder implements GameDslBuilder {
  /**
   * Build a GameDsl from a typed PromptAssemblyDomainModel.
   *
   * @param domainModel — typed domain model
   * @returns Deeply frozen GameDsl with world and entities
   */
  build(domainModel: PromptAssemblyDomainModel): GameDsl {
    // Derive world name
    const worldName = this.deriveWorldName(domainModel)

    // Generate entities from available sections
    const entities = this.generateEntities(domainModel)

    // Build and freeze the world
    const world: WorldDsl = Object.freeze({
      name: worldName,
      entities: Object.freeze(entities),
    })

    // Build and freeze the game DSL
    return Object.freeze({ world })
  }

  // -------------------------------------------------------------------------
  // Private — World Name Derivation
  // -------------------------------------------------------------------------

  /**
   * Derive the world name from the domain model overview section.
   *
   * Uses domainModel.overview.title when available.
   * Falls back to "Untitled World" when overview or title is missing.
   *
   * The title field is not yet part of OverviewDomain but is anticipated
   * by the builder design. This makes the builder forward-compatible:
   * when overview.title is added to the domain model, the builder
   * automatically picks it up without modification.
   */
  private deriveWorldName(domainModel: PromptAssemblyDomainModel): string {
    const overview = domainModel.overview
    if (overview === undefined || overview === null) {
      return FALLBACK_WORLD_NAME
    }

    // Safely extract title from overview (forward-compatible lookup)
    const overviewRecord = overview as unknown as Readonly<Record<string, unknown>>
    const title = overviewRecord.title
    if (typeof title === 'string' && title.length > 0) {
      return title
    }

    return FALLBACK_WORLD_NAME
  }

  // -------------------------------------------------------------------------
  // Private — Entity Generation
  // -------------------------------------------------------------------------

  /**
   * Generate one entity per available section in the domain model.
   *
   * Iterates over known section names and creates an entity for each
   * section that is present and non-null in the domain model.
   *
   * @param domainModel — typed domain model
   * @returns Array of frozen EntityDsl objects
   */
  private generateEntities(
    domainModel: PromptAssemblyDomainModel,
  ): readonly EntityDsl[] {
    const entities: EntityDsl[] = []

    for (const sectionName of SECTION_NAMES) {
      if (this.hasSection(domainModel, sectionName)) {
        entities.push(this.createSectionEntity(sectionName))
      }
    }

    return Object.freeze(entities)
  }

  /**
   * Check if a section exists and is non-null in the domain model.
   */
  private hasSection(
    domainModel: PromptAssemblyDomainModel,
    sectionName: SectionName,
  ): boolean {
    const section = (domainModel as unknown as Readonly<Record<string, unknown>>)[
      sectionName
    ]
    return section !== undefined && section !== null
  }

  /**
   * Create a single entity from a section name.
   *
   * Each entity gets:
   * - id: the section name
   * - type: the section name
   * - components: a single MetadataComponent tracking the source
   */
  private createSectionEntity(sectionName: string): EntityDsl {
    return Object.freeze({
      id: sectionName,
      type: sectionName,
      components: Object.freeze([
        this.createMetadataComponent(sectionName),
      ]),
    })
  }

  // -------------------------------------------------------------------------
  // Private — Component Creation
  // -------------------------------------------------------------------------

  /**
   * Create a MetadataComponent for a given section.
   *
   * MetadataComponent tracks the source section of this entity:
   * - type: "metadata"
   * - properties.source: the section name
   *
   * Purpose: validate DSL pipeline structure, not gameplay.
   */
  private createMetadataComponent(source: string): ComponentDsl {
    return Object.freeze({
      type: 'metadata',
      properties: Object.freeze({
        source,
      }),
    })
  }
}