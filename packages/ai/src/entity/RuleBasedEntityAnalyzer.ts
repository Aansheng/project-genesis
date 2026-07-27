import type { EntityAnalyzer } from './EntityAnalyzer'
import type { EntityResult } from './EntityResult'
import type { EntityType } from './EntityType'

/**
 * Keyword mapping from normalized keyword → EntityType.
 * Chinese keywords are used as-is (case-insensitive by nature).
 * English keywords are lowercase for case-insensitive matching.
 * Each keyword maps to exactly one entity type.
 */
const KEYWORD_MAP: Record<string, EntityType> = {
  // Tree
  树: 'Tree',
  树木: 'Tree',
  大树: 'Tree',
  小树: 'Tree',
  tree: 'Tree',

  // Flower
  花: 'Flower',
  鲜花: 'Flower',
  花朵: 'Flower',
  flower: 'Flower',

  // Grass
  草: 'Grass',
  草地: 'Grass',
  grass: 'Grass',

  // House
  房子: 'House',
  房屋: 'House',
  建筑: 'House',
  house: 'House',

  // Rock
  石头: 'Rock',
  岩石: 'Rock',
  rock: 'Rock',

  // Water
  河: 'Water',
  河流: 'Water',
  水: 'Water',
  湖: 'Water',
  海: 'Water',
  river: 'Water',
  water: 'Water',
  lake: 'Water',
  sea: 'Water',

  // Character
  人: 'Character',
  人物: 'Character',
  女孩: 'Character',
  男孩: 'Character',
  动物: 'Character',
  person: 'Character',
  girl: 'Character',
  boy: 'Character',
  animal: 'Character',
}

/**
 * Entity type order for deterministic matching.
 * Determines which entity type wins when multiple keywords match at the same position.
 */
const ENTITY_ORDER: EntityType[] = [
  'Tree',
  'Flower',
  'Grass',
  'House',
  'Rock',
  'Water',
  'Character',
]

/**
 * Punctuation characters to ignore during matching.
 * These characters are removed from the input before scanning.
 */
const PUNCTUATION_REGEX = /[\u3000\u3001\u3002\uff0c\u300a\u300b\u3008\u3009\u300c\u300d\u300e\u300f\uff08\uff09\uff1a\uff1b\uff01\uff1f\uff0e\uff09(){}.,:;!?、，。！？；：""''【】《》<>]/g

/**
 * RuleBasedEntityAnalyzer — production-ready keyword-based entity analyzer.
 *
 * Detects entity references from natural language using deterministic keyword matching.
 * Supports:
 *   - All 7 foundation entity types (Tree, Flower, Grass, House, Rock, Water, Character)
 *   - Chinese keywords (树, 花, 草, 房子, 石头, 河, 水, 湖, 海, 人, etc.)
 *   - English keywords (tree, flower, grass, house, rock, water, etc.)
 *   - Case-insensitive English matching
 *   - Multi-entity detection from single input
 *   - Duplicate removal (first occurrence preserved, order maintained)
 *   - Mixed language support (Chinese + English)
 *   - Unknown/empty input returns empty result
 *   - Punctuation and whitespace ignored
 *
 * Pure, stateless, deterministic — no I/O, no LLM, no external dependencies.
 * Implements EntityAnalyzer interface.
 */
export class RuleBasedEntityAnalyzer implements EntityAnalyzer {
  analyze(input: string): EntityResult {
    const trimmed = input.trim()
    if (trimmed.length === 0) {
      return { entities: [] }
    }

    // Normalize input for matching
    const normalized = this.normalizeInput(trimmed)

    // Find all keyword matches with their positions
    const matches = this.findMatches(normalized)

    // Deduplicate by entity type, preserving first-occurrence order
    const seen = new Set<EntityType>()
    const result: EntityType[] = []

    for (const match of matches) {
      if (!seen.has(match.type)) {
        seen.add(match.type)
        result.push(match.type)
      }
    }

    return { entities: result.map(type => ({ type })) }
  }

  /**
   * Normalize input for matching:
   * 1. Remove punctuation
   * 2. Collapse whitespace
   * 3. Convert to lowercase for case-insensitive English matching
   */
  private normalizeInput(input: string): string {
    return input
      .replace(PUNCTUATION_REGEX, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase()
  }

  /**
   * Find all keyword matches in the normalized input.
   * Uses position-based scanning to maintain input order.
   * Returns matches sorted by position.
   */
  private findMatches(normalized: string): Array<{ type: EntityType; position: number }> {
    const matches: Array<{ type: EntityType; position: number }> = []

    // For each keyword, find its earliest occurrence in the input
    for (const [keyword, type] of Object.entries(KEYWORD_MAP)) {
      // Chinese keywords are stored as-is; English keywords are already lowercase
      const normalizedKeyword = keyword.toLowerCase()
      const position = normalized.indexOf(normalizedKeyword)
      if (position !== -1) {
        matches.push({ type, position })
      }
    }

    // Sort by position (first occurrence first), then by ENTITY_ORDER for ties
    matches.sort((a, b) => {
      if (a.position !== b.position) {
        return a.position - b.position
      }
      return ENTITY_ORDER.indexOf(a.type) - ENTITY_ORDER.indexOf(b.type)
    })

    return matches
  }
}