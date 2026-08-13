/**
 * DefaultPromptEntityExtractor — rule-based implementation of PromptEntityExtractor.
 *
 * Extracts entities from a PromptAssemblyDomainModel using keyword matching
 * on the overview title. Each known keyword maps to a specific EntityCategory.
 *
 * This is NOT AI extraction. This is deterministic, rule-based extraction.
 * No LLM, no NLP, no semantic analysis, no interpretation.
 *
 * Supported keywords (case-insensitive):
 * - 'npc':       merchant, farmer, villager
 * - 'building':  barn, storage, town
 * - 'quest':     quest
 * - 'enemy':     boss, enemy
 * - 'terrain':   forest, tree, stone
 * - 'item':      campfire
 * - 'terrain':   platform, checkpoint
 *
 * Design:
 * - Pure: no side effects, no I/O, no external calls
 * - Stateless: no internal state between extractions
 * - Deterministic: same input always produces same output
 * - Immutable: all outputs are deeply frozen
 * - Defensive: safe extraction, no assumptions about input shape
 * - Rule-based: keyword matching only, no AI or NLP
 */
import type { EntityCategory } from '@genesis/shared'
import type { ExtractedEntity } from './ExtractedEntity'
import type { PromptEntityExtractor } from './PromptEntityExtractor'
import type { PromptAssemblyDomainModel } from '../../observatory/domain'

// ---------------------------------------------------------------------------
// Keyword Definition
// ---------------------------------------------------------------------------

/** A keyword entry mapping a text keyword to its entity category. */
interface KeywordEntry {
  /** The category this keyword maps to. */
  readonly category: EntityCategory

  /** The keyword to match (lowercase). */
  readonly keyword: string
}

// ---------------------------------------------------------------------------
// Keyword Catalog
// ---------------------------------------------------------------------------

/**
 * The complete keyword-to-category mapping.
 *
 * Ordered for deterministic output:
 * - npc:       merchant, farmer, villager
 * - building:  barn, storage, town
 * - quest:     quest
 * - enemy:     boss, enemy
 * - terrain:   forest, platform, checkpoint, tree, stone
 * - item:      campfire
 */
const KEYWORD_CATALOG: readonly KeywordEntry[] = Object.freeze([
  // NPCs
  { keyword: 'merchant', category: 'npc' },
  { keyword: 'farmer', category: 'npc' },
  { keyword: 'villager', category: 'npc' },

  // Buildings
  { keyword: 'barn', category: 'building' },
  { keyword: 'storage', category: 'building' },
  { keyword: 'town', category: 'building' },

  // Quest
  { keyword: 'quest', category: 'quest' },

  // Enemies
  { keyword: 'boss', category: 'enemy' },
  { keyword: 'enemy', category: 'enemy' },

  // Terrain
  { keyword: 'forest', category: 'terrain' },
  { keyword: 'platform', category: 'terrain' },
  { keyword: 'checkpoint', category: 'terrain' },
  { keyword: 'tree', category: 'terrain' },
  { keyword: 'stone', category: 'terrain' },

  // Items
  { keyword: 'campfire', category: 'item' },
])

// ---------------------------------------------------------------------------
// DefaultPromptEntityExtractor
// ---------------------------------------------------------------------------

/**
 * DefaultPromptEntityExtractor — rule-based implementation of PromptEntityExtractor.
 *
 * Pure. Stateless. Deterministic. Rule-based.
 */
export class DefaultPromptEntityExtractor implements PromptEntityExtractor {
  /**
   * Extract entities from a PromptAssemblyDomainModel.
   *
   * Scans the overview title for known keywords and produces a
   * deduplicated, deterministically ordered list of extracted entities.
   *
   * @param model — typed PromptAssemblyDomainModel
   * @returns Frozen readonly array of ExtractedEntity
   */
  extract(model: PromptAssemblyDomainModel): readonly ExtractedEntity[] {
    // Handle invalid input
    if (model === undefined || model === null) {
      return Object.freeze([])
    }
    if (typeof model !== 'object' || Array.isArray(model)) {
      return Object.freeze([])
    }

    // Extract title text from the overview
    const title = this.extractTitle(model)

    if (title === undefined) {
      return Object.freeze([])
    }

    // Extract entities via keyword matching
    return this.matchEntities(title)
  }

  // -------------------------------------------------------------------------
  // Private — Title Extraction
  // -------------------------------------------------------------------------

  /**
   * Extract the title string from the domain model overview.
   *
   * Uses forward-compatible Record access to handle the optional
   * title field that may or may not exist on OverviewDomain.
   *
   * @param model — the domain model
   * @returns The title string, or undefined
   */
  private extractTitle(model: PromptAssemblyDomainModel): string | undefined {
    const overview = model.overview

    if (overview === undefined || overview === null) {
      return undefined
    }

    const overviewRecord = overview as unknown as Readonly<Record<string, unknown>>
    const title = overviewRecord.title

    if (typeof title !== 'string' || title.length === 0) {
      return undefined
    }

    return title
  }

  // -------------------------------------------------------------------------
  // Private — Keyword Matching
  // -------------------------------------------------------------------------

  /**
   * Match keywords in the title against the keyword catalog.
   *
   * Produces a deduplicated, deterministically ordered list.
   * Deduplication is by keyword — if the same keyword appears
   * multiple times, only the first match is included.
   * Ordering follows the catalog definition order.
   *
   * @param title — the title text to scan
   * @returns Frozen array of extracted entities
   */
  private matchEntities(title: string): readonly ExtractedEntity[] {
    const lowerTitle = title.toLowerCase()
    const seen = new Set<string>()
    const results: ExtractedEntity[] = []

    for (const entry of KEYWORD_CATALOG) {
      if (lowerTitle.includes(entry.keyword)) {
        // Skip duplicates
        if (seen.has(entry.keyword)) {
          continue
        }
        seen.add(entry.keyword)

        results.push(
          Object.freeze({
            category: entry.category,
            name: this.capitalize(entry.keyword),
          }),
        )
      }
    }

    return Object.freeze(results)
  }

  /**
   * Capitalize the first letter of a string.
   *
   * @param value — the string to capitalize
   * @returns The capitalized string
   */
  private capitalize(value: string): string {
    if (value.length === 0) {
      return value
    }
    return value.charAt(0).toUpperCase() + value.slice(1)
  }
}