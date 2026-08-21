/**
 * DefaultGameIntentExtractor — default implementation of GameIntentExtractor.
 *
 * Detection rules:
 * - contains "mario", "platformer", or the Chinese platformer phrase → genre = platformer
 * - contains "farm"  → genre = farm
 * - contains "rpg"   → genre = rpg
 * - contains "survival" or "survivor" → genre = survival
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
// Detection keywords (lowercase)
// ---------------------------------------------------------------------------

/** Platformer detection keyword. */
const KEYWORD_PLATFORMER = 'mario'

/** Direct platformer wording used by the Studio and Chinese product examples. */
const PLATFORMER_ALIASES: readonly string[] = Object.freeze(['platformer', '平台跳跃', '平台游戏', '平台'])

/** Farm detection keyword. */
const KEYWORD_FARM = 'farm'

/** RPG detection keyword. */
const KEYWORD_RPG = 'rpg'

/** Survival detection keyword. */
const KEYWORD_SURVIVAL = 'survival'

/** Common survivor-like game alias. */
const KEYWORD_SURVIVOR = 'survivor'

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

    // Detect genre from title
    const lowerTitle = resolvedTitle.toLowerCase()

    let genre: GameGenre

    if (lowerTitle.includes(KEYWORD_PLATFORMER) || PLATFORMER_ALIASES.some(keyword => lowerTitle.includes(keyword))) {
      genre = 'platformer'
    } else if (lowerTitle.includes(KEYWORD_FARM)) {
      genre = 'farm'
    } else if (lowerTitle.includes(KEYWORD_RPG)) {
      genre = 'rpg'
    } else if (lowerTitle.includes(KEYWORD_SURVIVAL) || lowerTitle.includes(KEYWORD_SURVIVOR)) {
      genre = 'survival'
    } else {
      genre = FALLBACK_GENRE
    }

    return Object.freeze({ genre, title: resolvedTitle })
  }
}
