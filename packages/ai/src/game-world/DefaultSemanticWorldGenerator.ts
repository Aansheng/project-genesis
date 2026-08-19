/**
 * DefaultSemanticWorldGenerator — default implementation of SemanticWorldGenerator.
 *
 * Converts a PromptAssemblyDomainModel into a GameWorldModel using deterministic
 * rule-based semantic synthesis. The world type is resolved from an
 * authoritative GameIntent in the integrated pipeline; standalone callers
 * retain a title-based compatibility fallback. Default entities are generated
 * using a WorldTemplateCatalog.
 *
 * Prompt Entity Extraction is integrated into the generation flow:
 * PromptAssemblyDomainModel
 *   ↓
 * PromptEntityExtractor
 *   ↓
 * ExtractedEntities
 *   ↓
 * TemplateEntities
 *   ↓
 * Merge (template first, extracted appended, deduplicated by name)
 *   ↓
 * GameWorldModel
 *
 * This is NOT AI generation. This is deterministic, rule-based synthesis.
 * No LLM, no gameplay logic, no interpretation.
 *
 * Legacy world type detection (from overview title, standalone fallback):
 * - Contains "farm"      → 'farm'
 * - Contains "rpg"       → 'rpg'
 * - Contains "platform"  → 'platformer'
 * - Contains "survival"  → 'survival'
 * - Otherwise            → 'sandbox'
 *
 * Entity generation via WorldTemplateCatalog:
 * - farm:       8 entities (player, merchant, farmer, barn, wheat-field, corn-field, storage, harvest-quest)
 * - rpg:        9 entities (player, villager, merchant, quest-giver, enemy, boss, town, forest, main-quest)
 * - platformer: 6 entities (player, terrain, platform, enemy, goal, checkpoint)
 * - survival:   6 entities (player, resource, tree, stone, enemy, campfire)
 * - sandbox:    1 entity (player)
 *
 * Design:
 * - Pure: no side effects, no I/O, no external calls
 * - Stateless: no internal state between generates
 * - Deterministic: same input always produces same output
 * - Immutable: all outputs are deeply frozen
 * - Defensive: safe extraction, no assumptions about input shape
 * - Catalog-driven: entity templates are provided by WorldTemplateCatalog
 * - Extraction-integrated: prompt content influences generated entities
 */
import type { PromptAssemblyDomainModel } from '../observatory/domain'
import type { GameIntent, GameGenre } from '../game-intent/GameIntent'
import type { GameWorldModel, WorldType, GameWorldEntity } from '@genesis/shared'
import type { SemanticWorldGenerator } from './SemanticWorldGenerator'
import type { WorldTemplateCatalog } from './catalog'
import { DefaultWorldTemplateCatalog } from './catalog'
import type { PromptEntityExtractor, ExtractedEntity } from './extraction'
import { DefaultPromptEntityExtractor } from './extraction'
import type { PromptEntityCountExtractor, ExtractedEntityCount } from './extraction'
import { DefaultPromptEntityCountExtractor } from './extraction'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default world type when no title-based detection matches. */
const DEFAULT_WORLD_TYPE: WorldType = 'sandbox'

/** Typed mapping from authoritative GameIntent genres to semantic world types. */
const GAME_GENRE_TO_WORLD_TYPE: Readonly<Record<GameGenre, WorldType>> = Object.freeze({
  platformer: 'platformer',
  farm: 'farm',
  rpg: 'rpg',
  survival: 'survival',
  sandbox: 'sandbox',
})

/** Keyword-to-world-type mapping for title-based detection. */
const WORLD_TYPE_KEYWORDS: Readonly<Array<{ keyword: string; worldType: WorldType }>> =
  Object.freeze([
    { keyword: 'farm', worldType: 'farm' },
    { keyword: 'rpg', worldType: 'rpg' },
    { keyword: 'platform', worldType: 'platformer' },
    { keyword: 'survival', worldType: 'survival' },
  ])

// ---------------------------------------------------------------------------
// DefaultSemanticWorldGenerator
// ---------------------------------------------------------------------------

/**
 * DefaultSemanticWorldGenerator — default implementation of SemanticWorldGenerator.
 *
 * Pure. Stateless. Deterministic. Rule-based. Catalog-driven.
 */
export class DefaultSemanticWorldGenerator implements SemanticWorldGenerator {
  private readonly catalog: WorldTemplateCatalog
  private readonly entityExtractor: PromptEntityExtractor
  private readonly countExtractor: PromptEntityCountExtractor

  /**
   * @param catalog — optional WorldTemplateCatalog; defaults to DefaultWorldTemplateCatalog
   * @param entityExtractor — optional PromptEntityExtractor; defaults to DefaultPromptEntityExtractor
   * @param countExtractor — optional PromptEntityCountExtractor; defaults to DefaultPromptEntityCountExtractor
   */
  constructor(
    catalog?: WorldTemplateCatalog,
    entityExtractor?: PromptEntityExtractor,
    countExtractor?: PromptEntityCountExtractor,
  ) {
    this.catalog = catalog ?? new DefaultWorldTemplateCatalog()
    this.entityExtractor = entityExtractor ?? new DefaultPromptEntityExtractor()
    this.countExtractor = countExtractor ?? new DefaultPromptEntityCountExtractor()
  }

  /**
   * Generate a GameWorldModel from a PromptAssemblyDomainModel.
   *
   * Uses rule-based world type detection and the WorldTemplateCatalog
   * for entity generation, then integrates prompt entity extraction.
   *
   * Flow:
   * 1. Resolve world type from GameIntent when provided, otherwise use the
   *    standalone title-based compatibility fallback
   * 2. Generate template entities for the world type
   * 3. Extract entities from the prompt content
   * 4. Merge: template first, extracted appended, deduplicated by name
   * 5. Freeze and return
   *
   * @param model — typed PromptAssemblyDomainModel
   * @param intent — optional authoritative GameIntent from the create-world pipeline
   * @returns Deeply frozen GameWorldModel
   */
  generate(model: PromptAssemblyDomainModel, intent?: GameIntent): GameWorldModel {
    // Handle invalid input
    if (model === undefined || model === null) {
      return this.createEmptyModel()
    }
    if (typeof model !== 'object' || Array.isArray(model)) {
      return this.createEmptyModel()
    }

    // GameIntent is authoritative in the integrated pipeline. The title-based
    // path remains only for backward-compatible standalone generator callers.
    const worldType = intent === undefined
      ? this.detectWorldType(model)
      : this.resolveIntentWorldType(intent)

    // Generate template entities for the detected world type via catalog
    const templateEntities = this.generateTemplateEntities(worldType)

    // Extract entities from the prompt content
    const extractedEntities = this.entityExtractor.extract(model)

    // Extract entity counts from the prompt content
    const extractedCounts = this.countExtractor.extractCounts(model)

    // Expand extracted entities by their counts
    const expandedEntities = this.expandExtractedEntities(
      extractedEntities,
      extractedCounts,
    )

    // Merge template entities with expanded extracted entities
    const mergedEntities = this.mergeEntities(
      templateEntities,
      expandedEntities,
    )

    // Build and freeze the model
    return Object.freeze({
      worldType,
      entities: Object.freeze(mergedEntities),
    })
  }

  // -------------------------------------------------------------------------
  // Private — World Type Detection
  // -------------------------------------------------------------------------

  /** Resolve a typed GameIntent genre without re-interpreting prompt text. */
  private resolveIntentWorldType(intent: GameIntent): WorldType {
    return GAME_GENRE_TO_WORLD_TYPE[intent.genre] ?? DEFAULT_WORLD_TYPE
  }

  /**
   * Detect the world type from the domain model's overview section.
   */
  private detectWorldType(model: PromptAssemblyDomainModel): WorldType {
    const overview = model.overview

    if (overview === undefined || overview === null) {
      return DEFAULT_WORLD_TYPE
    }

    // Forward-compatible title extraction
    const overviewRecord = overview as unknown as Readonly<Record<string, unknown>>
    const title = overviewRecord.title

    if (typeof title !== 'string' || title.length === 0) {
      return DEFAULT_WORLD_TYPE
    }

    return this.matchWorldType(title)
  }

  /**
   * Match a title string against known world type keywords.
   */
  private matchWorldType(title: string): WorldType {
    const lowerTitle = title.toLowerCase()

    for (const entry of WORLD_TYPE_KEYWORDS) {
      if (lowerTitle.includes(entry.keyword)) {
        return entry.worldType
      }
    }

    return DEFAULT_WORLD_TYPE
  }

  // -------------------------------------------------------------------------
  // Private — Entity Generation
  // -------------------------------------------------------------------------

  /**
   * Generate template entities for the given world type using the catalog.
   *
   * Returns frozen entities from the WorldTemplateCatalog template.
   * Each entity is a frozen GameWorldEntity with id, category, and name.
   */
  private generateTemplateEntities(worldType: WorldType): readonly GameWorldEntity[] {
    const template = this.catalog.getTemplate(worldType)

    if (!template || !template.entities || template.entities.length === 0) {
      return Object.freeze([])
    }

    return template.entities
  }

  // -------------------------------------------------------------------------
  // Private — Entity Expansion by Count
  // -------------------------------------------------------------------------

  /**
   * Expand extracted entities by their associated counts.
   *
   * For each extracted entity with a matching count entry:
   * - count = 1 or no match → creates one entity (no suffix)
   * - count > 1 → creates N entities with suffixed ids
   *
   * Examples:
   *   Entity "Farmer" with count 3 → farmer-1, farmer-2, farmer-3
   *   Entity "Boss" with count 1  → boss (no suffix)
   *
   * @param extractedEntities — entities extracted from the prompt
   * @param extractedCounts — counts extracted from the prompt
   * @returns Array of expanded GameWorldEntity (not yet frozen)
   */
  private expandExtractedEntities(
    extractedEntities: readonly ExtractedEntity[],
    extractedCounts: readonly ExtractedEntityCount[],
  ): GameWorldEntity[] {
    if (extractedEntities.length === 0) {
      return []
    }

    // Build a count lookup map (case-insensitive keyword → count)
    const countMap = new Map<string, number>()
    for (const countEntry of extractedCounts) {
      countMap.set(countEntry.name.toLowerCase(), countEntry.count)
    }

    const expanded: GameWorldEntity[] = []

    for (const extracted of extractedEntities) {
      const lowerName = extracted.name.toLowerCase()
      const count = countMap.get(lowerName) ?? 1

      if (count <= 1) {
        // Single entity — no suffix (existing behavior)
        expanded.push({
          id: lowerName,
          category: extracted.category,
          name: extracted.name,
        })
      } else {
        // Multiple entities — suffixed ids
        for (let i = 1; i <= count; i++) {
          expanded.push({
            id: `${lowerName}-${i}`,
            category: extracted.category,
            name: extracted.name,
          })
        }
      }
    }

    return expanded
  }

  // -------------------------------------------------------------------------
  // Private — Entity Merging
  // -------------------------------------------------------------------------

  /**
   * Merge template entities with expanded extracted entities.
   *
   * Rules:
   * 1. Template entities come first (preserving template order)
   * 2. Expanded extracted entities are appended after template entities
   * 3. Deduplication by name (case-insensitive): if an extracted entity's
   *    name matches any template entity's name, it is skipped
   * 4. Deterministic ordering: template order → catalog order
   *
   * @param templateEntities — entities from the WorldTemplateCatalog template
   * @param expandedEntities — expanded GameWorldEntity array from count extraction
   * @returns Non-frozen array of merged GameWorldEntity (frozen by caller)
   */
  private mergeEntities(
    templateEntities: readonly GameWorldEntity[],
    expandedEntities: readonly GameWorldEntity[],
  ): GameWorldEntity[] {
    if (expandedEntities.length === 0) {
      // Fast path: no extraction, return template entities as-is
      return [...templateEntities]
    }

    const result: GameWorldEntity[] = [...templateEntities]
    const counts = new Map<string, number>()
    for (const entity of result) counts.set(entity.name.toLowerCase(), (counts.get(entity.name.toLowerCase()) ?? 0) + 1)

    for (const expanded of expandedEntities) {
      const lowerName = expanded.name.toLowerCase()
      const currentCount = counts.get(lowerName) ?? 0
      const hasExplicitCount = /-\d+$/u.test(expanded.id)
      if (currentCount > 0 && !hasExplicitCount) continue
      const requestedCount = Number(expanded.id.match(/-(\d+)$/u)?.[1] ?? 1)
      if (currentCount >= requestedCount) continue
      const suffix = currentCount === 0 ? '' : `-${currentCount + 1}`
      result.push(suffix ? { ...expanded, id: `${lowerName}${suffix}` } : expanded)
      counts.set(lowerName, currentCount + 1)
    }

    return result
  }

  // -------------------------------------------------------------------------
  // Private — Empty Model
  // -------------------------------------------------------------------------

  /**
   * Create an empty GameWorldModel.
   */
  private createEmptyModel(): GameWorldModel {
    return Object.freeze({
      worldType: DEFAULT_WORLD_TYPE,
      entities: Object.freeze([]),
    })
  }
}
