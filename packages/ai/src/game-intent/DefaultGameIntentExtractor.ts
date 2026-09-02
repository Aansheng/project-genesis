/**
 * DefaultGameIntentExtractor — default implementation of GameIntentExtractor.
 *
 * Detection rules:
 * - contains "mario", "platformer", or the Chinese platformer phrase → genre = platformer
 * - contains "farm" or "农场" → genre = farm
 * - contains "rpg"   → genre = rpg
 * - contains "survival", "survivor", "生存", or "幸存者" → genre = survival
 * - otherwise        → genre = sandbox
 *
 * Title extraction:
 * - overview.title if present and non-empty
 * - fallback: "Untitled Game"
 *
 * Pure. Stateless. Deterministic. Immutable. Frozen output.
 */
import type { PromptAssemblyDomainModel } from '../observatory/domain'
import type { GameGenre, GameIntent } from './GameIntent'
import type { GameIntentExtractor } from './GameIntentExtractor'

// ---------------------------------------------------------------------------
// Ordered detection aliases (lowercase where applicable)
// ---------------------------------------------------------------------------

/**
 * Immutable, ordered aliases for the currently supported non-fallback genres.
 * The order preserves the extractor's existing precedence for overlapping text.
 */
const GENRE_ALIAS_RULES = Object.freeze([
  Object.freeze({
    genre: 'platformer' as const,
    aliases: Object.freeze(['mario', 'platformer', '平台跳跃', '平台游戏', '平台']),
  }),
  Object.freeze({
    genre: 'farm' as const,
    aliases: Object.freeze(['farm', '农场']),
  }),
  Object.freeze({
    genre: 'rpg' as const,
    aliases: Object.freeze(['rpg']),
  }),
  Object.freeze({
    genre: 'survival' as const,
    aliases: Object.freeze(['survival', 'survivor', '生存', '幸存者']),
  }),
])

// ---------------------------------------------------------------------------
// Fallback
// ---------------------------------------------------------------------------

/** Default title when no title is available. */
const FALLBACK_TITLE = 'Untitled Game'

/** Default genre when no keyword is matched. */
const FALLBACK_GENRE: GameGenre = 'sandbox'

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/**
 * Safely extract the overview title from a domain model.
 * Returns undefined if the title is missing, empty, or not a string.
 */
function extractTitle(model: PromptAssemblyDomainModel): string | undefined {
  if (
    model === undefined ||
    model === null ||
    typeof model !== 'object' ||
    Array.isArray(model)
  ) {
    return undefined
  }

  const overview = model.overview
  if (overview === undefined || overview === null) {
    return undefined
  }

  // The domain model overview may have a title field
  // We use a safe type access pattern
  const title = (overview as unknown as Record<string, unknown>).title
  if (typeof title !== 'string' || title.trim().length === 0) {
    return undefined
  }

  return title
}

// ---------------------------------------------------------------------------
// DefaultGameIntentExtractor
// ---------------------------------------------------------------------------

/**
 * DefaultGameIntentExtractor — rule-based game intent extraction.
 *
 * Scans the overview title for genre-indicative keywords.
 * Returns a frozen GameIntent.
 */
export class DefaultGameIntentExtractor implements GameIntentExtractor {
  /**
   * Extract a GameIntent from a PromptAssemblyDomainModel.
   *
   * @param model — typed PromptAssemblyDomainModel
   * @returns Frozen GameIntent with genre and title
   */
  extract(model: PromptAssemblyDomainModel): GameIntent {
    // Extract title
    const title = extractTitle(model)
    const resolvedTitle = title ?? FALLBACK_TITLE

    // Detect genre from title using the existing ordered substring semantics.
    const lowerTitle = resolvedTitle.toLowerCase()
    const genre: GameGenre = GENRE_ALIAS_RULES.find(({ aliases }) =>
      aliases.some(alias => lowerTitle.includes(alias)),
    )?.genre ?? FALLBACK_GENRE

    return Object.freeze({ genre, title: resolvedTitle })
  }
}
