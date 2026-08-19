/**
 * DefaultPromptEntityCountExtractor — rule-based implementation of
 * PromptEntityCountExtractor.
 *
 * Extracts entity counts from a PromptAssemblyDomainModel by scanning
 * the overview title for patterns like "<number> <keyword>". Supports
 * numeric digits (1-10) and lowercase word-based numbers (one-ten).
 *
 * This is NOT AI extraction. This is deterministic, rule-based extraction.
 * No LLM, no NLP, no semantic analysis, no interpretation.
 *
 * Supported numbers:
 * - Numeric: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
 * - Word: one, two, three, four, five, six, seven, eight, nine, ten
 *
 * Supported entity keywords (shared with DefaultPromptEntityExtractor):
 *   merchant, farmer, villager, cow, barn, storage, town, quest,
 *   boss, enemy, slime, forest, platform, checkpoint, tree, stone, campfire
 *
 * Design:
 * - Pure: no side effects, no I/O, no external calls
 * - Stateless: no internal state between extractions
 * - Deterministic: same input always produces same output
 * - Immutable: all outputs are deeply frozen
 * - Defensive: safe extraction, no assumptions about input shape
 * - Rule-based: keyword matching only, no AI or NLP
 */
import type { ExtractedEntityCount } from './ExtractedEntityCount'
import type { PromptEntityCountExtractor } from './PromptEntityCountExtractor'
import type { PromptAssemblyDomainModel } from '../../observatory/domain'

// ---------------------------------------------------------------------------
// Number Mapping
// ---------------------------------------------------------------------------

/** Mapping from word-based number to numeric value. */
const WORD_NUMBERS: Readonly<Record<string, number>> = Object.freeze({
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
})

/** Numeric characters used for direct digit matching. */
const NUMERIC_CHARS: ReadonlySet<string> = Object.freeze(
  new Set(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']),
)

// ---------------------------------------------------------------------------
// Entity Keywords (shared with DefaultPromptEntityExtractor)
// ---------------------------------------------------------------------------

/**
 * The set of known entity keywords for count matching.
 * These must match the keywords in DefaultPromptEntityExtractor's catalog.
 */
const ENTITY_KEYWORDS: readonly string[] = Object.freeze([
  'merchant',
  'farmer',
  'villager',
  'cow',
  'barn',
  'storage',
  'town',
  'quest',
  'boss',
  'enemy',
  'slime',
  'forest',
  'platform',
  'checkpoint',
  'tree',
  'stone',
  'campfire',
])

// ---------------------------------------------------------------------------
// DefaultPromptEntityCountExtractor
// ---------------------------------------------------------------------------

/**
 * DefaultPromptEntityCountExtractor — rule-based implementation.
 *
 * Pure. Stateless. Deterministic. Rule-based.
 */
export class DefaultPromptEntityCountExtractor
  implements PromptEntityCountExtractor
{
  /**
   * Extract entity counts from a PromptAssemblyDomainModel.
   *
   * Scans the overview title for "<number> <keyword>" patterns
   * and produces a deduplicated, deterministically ordered list.
   *
   * Matching rules:
   * - Title is tokenized into whitespace-separated words
   * - Each word is checked: is it a number (numeric or word)?
   * - If yes, the next word is checked: does it match an entity keyword?
   * - Plural forms are handled via startsWith() (e.g., "farmers" → "farmer")
   * - Deduplication: first match wins per keyword
   * - Ordering: follows keyword definition order
   *
   * @param model — typed PromptAssemblyDomainModel
   * @returns Frozen readonly array of ExtractedEntityCount
   */
  extractCounts(
    model: PromptAssemblyDomainModel,
  ): readonly ExtractedEntityCount[] {
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

    // Extract counts via number+keyword matching
    return this.matchCounts(title)
  }

  // -------------------------------------------------------------------------
  // Private — Title Extraction
  // -------------------------------------------------------------------------

  /**
   * Extract the title string from the domain model overview.
   */
  private extractTitle(
    model: PromptAssemblyDomainModel,
  ): string | undefined {
    const overview = model.overview

    if (overview === undefined || overview === null) {
      return undefined
    }

    const overviewRecord =
      overview as unknown as Readonly<Record<string, unknown>>
    const title = overviewRecord.title

    if (typeof title !== 'string' || title.length === 0) {
      return undefined
    }

    return title
  }

  // -------------------------------------------------------------------------
  // Private — Number+Keyword Matching
  // -------------------------------------------------------------------------

  /**
   * Match number+keyword patterns in the title.
   *
   * Tokenizes the title, scans for <number> <keyword> pairs,
   * deduplicates by keyword, and returns in catalog order.
   *
   * @param title — the title text to scan
   * @returns Frozen array of extracted entity counts
   */
  private matchCounts(title: string): readonly ExtractedEntityCount[] {
    const lowerTitle = title.toLowerCase()
    const compactMatches = this.matchCompactCounts(lowerTitle)
    const tokens = this.tokenize(lowerTitle)

    if (tokens.length < 2 && compactMatches.size === 0) {
      return Object.freeze([])
    }

    // Collect raw matches: keyword → count (first match wins)
    const rawMatches = new Map<string, number>()
    const seenKeywords = new Set<string>()

    for (let i = 0; i < tokens.length - 1; i++) {
      const current = tokens[i]
      const nextWord = tokens[i + 1]

      // Skip if current token is not a number
      const count = this.parseNumber(current)
      if (count === undefined) {
        continue
      }

      // Check if next word matches an entity keyword
      const matchedKeyword = this.matchEntityKeyword(nextWord)
      if (matchedKeyword === undefined) {
        continue
      }

      // Skip duplicates
      if (seenKeywords.has(matchedKeyword)) {
        continue
      }
      seenKeywords.add(matchedKeyword)

      rawMatches.set(matchedKeyword, count)
    }

    for (const [keyword, count] of compactMatches) {
      if (!rawMatches.has(keyword)) rawMatches.set(keyword, count)
    }

    // Build result in catalog order
    const results: ExtractedEntityCount[] = []

    for (const keyword of ENTITY_KEYWORDS) {
      if (rawMatches.has(keyword)) {
        results.push(
          Object.freeze({
            name: keyword,
            count: rawMatches.get(keyword)!,
          }),
        )
      }
    }

    return Object.freeze(results)
  }

  private matchCompactCounts(title: string): ReadonlyMap<string, number> {
    const aliases: Readonly<Record<string, readonly string[]>> = Object.freeze({
      cow: Object.freeze(['cow', 'cows', '牛', '奶牛']),
      slime: Object.freeze(['slime', 'slimes', '史莱姆']),
      merchant: Object.freeze(['merchant', '商人']),
      villager: Object.freeze(['villager', 'villagers', '村民']),
    })
    const numberPattern = '(?:[0-9]+|一个|两个|三个|四个|五个|六个|七个|八个|九个|十个|一|二|三|四|五|六|七|八|九|十)'
    const matches = new Map<string, number>()
    for (const keyword of Object.keys(aliases)) {
      for (const alias of aliases[keyword]) {
        const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const match = title.match(new RegExp(`(?:^|[^0-9])(${numberPattern})\\s*(?:只|头|个)?\\s*${escaped}`, 'u'))
        if (match) {
          matches.set(keyword, this.parseLocalizedNumber(match[1]))
          break
        }
      }
    }
    return matches
  }

  private parseLocalizedNumber(value: string): number {
    const compactWords: Readonly<Record<string, number>> = {
      一: 1, 一个: 1, 二: 2, 两个: 2, 两: 2, 三: 3, 三个: 3,
      四: 4, 四个: 4, 五: 5, 五个: 5, 六: 6, 六个: 6,
      七: 7, 七个: 7, 八: 8, 八个: 8, 九: 9, 九个: 9, 十: 10, 十个: 10,
    }
    return compactWords[value] ?? Number(value)
  }

  /**
   * Tokenize a string into whitespace-separated words.
   *
   * Removes empty tokens from consecutive whitespace.
   *
   * @param value — the string to tokenize
   * @returns Array of word tokens
   */
  private tokenize(value: string): string[] {
    return value.split(/\s+/).filter((t) => t.length > 0)
  }

  /**
   * Try to parse a number from a token.
   *
   * Supports:
   * - Numeric digits (1-10, but also other numbers)
   * - Word-based numbers (one-ten)
   *
   * @param token — the token to parse
   * @returns The parsed number, or undefined if not a supported number
   */
  private parseNumber(token: string): number | undefined {
    // Check word-based numbers first
    const wordValue = WORD_NUMBERS[token]
    if (wordValue !== undefined) {
      return wordValue
    }

    // Check numeric digits
    if (token.length === 1 && NUMERIC_CHARS.has(token)) {
      return parseInt(token, 10)
    }

    // Check multi-digit numbers (e.g., "11", "100")
    // Only parse if all characters are digits
    if (token.length > 1 && this.isAllDigits(token)) {
      return parseInt(token, 10)
    }

    return undefined
  }

  /**
   * Check if a string consists entirely of digit characters.
   */
  private isAllDigits(value: string): boolean {
    for (let i = 0; i < value.length; i++) {
      if (!NUMERIC_CHARS.has(value[i])) {
        return false
      }
    }
    return true
  }

  /**
   * Match a word against known entity keywords.
   *
   * Handles plural forms through depluralization:
   * - "farmers" → "farmer"  (remove trailing 's')
   * - "bosses"  → "boss"    (remove trailing 'es')
   * - "enemies" → "enemy"   (-ies → -y conversion)
   *
   * @param word — the word to match
   * @returns The matched keyword, or undefined
   */
  private matchEntityKeyword(word: string): string | undefined {
    const aliases: Readonly<Record<string, readonly string[]>> = {
      cow: ['cow', 'cows', '牛', '奶牛'],
      slime: ['slime', 'slimes', '史莱姆'],
      merchant: ['merchant', '商人'],
      villager: ['villager', 'villagers', '村民'],
    }
    for (const keyword of Object.keys(aliases)) {
      if (aliases[keyword].includes(word)) return keyword
    }
    for (const keyword of ENTITY_KEYWORDS) {
      // Direct match
      if (word === keyword) {
        return keyword
      }

      // Handle -ies → -y (irregular plural: enemies → enemy)
      if (word.endsWith('ies') && word.slice(0, -3) + 'y' === keyword) {
        return keyword
      }

      // Handle -es → (bosses → boss)
      if (word.endsWith('es') && word.slice(0, -2) === keyword) {
        return keyword
      }

      // Handle -s → (farmers → farmer)
      if (word.endsWith('s') && word.slice(0, -1) === keyword) {
        return keyword
      }
    }
    return undefined
  }
}
