/**
 * DefaultIntentRouter — default implementation of IntentRouter.
 *
 * Routing rules:
 * - contains "create", "创建", "生成", or "build" → route = create-world
 * - additional genre keyword confidence boost:
 *   - contains "mario", "farm", "rpg", or "survival" → confidence = 1.0 (with creation keyword)
 *   - creation keyword only (no genre keyword) → confidence = 0.8
 * - otherwise → route = unknown, confidence = 0.0
 *
 * Pure. Stateless. Deterministic. Immutable. Frozen output.
 */
import type { IntentRoute } from './IntentRoute'
import type { IntentRoutingResult } from './IntentRoutingResult'
import type { IntentRouter } from './IntentRouter'

// ---------------------------------------------------------------------------
// Creation keywords (lowercase)
// ---------------------------------------------------------------------------

/** English creation keyword. */
const KEYWORD_CREATE = 'create'

/** Chinese creation keyword. */
const KEYWORD_CREATE_CN = '创建'

/** Chinese generation keyword. */
const KEYWORD_GENERATE = '生成'

/** English build keyword. */
const KEYWORD_BUILD = 'build'

// ---------------------------------------------------------------------------
// Genre keywords (lowercase)
// ---------------------------------------------------------------------------

/** Platformer genre keyword. */
const KEYWORD_MARIO = 'mario'

/** Farm genre keyword. */
const KEYWORD_FARM = 'farm'

/** RPG genre keyword. */
const KEYWORD_RPG = 'rpg'

/** Survival genre keyword. */
const KEYWORD_SURVIVAL = 'survival'

// ---------------------------------------------------------------------------
// Confidence levels
// ---------------------------------------------------------------------------

/** Confidence when both creation and genre keywords are present. */
const CONFIDENCE_DEFINITE = 1.0

/** Confidence when only a creation keyword is present. */
const CONFIDENCE_STRONG = 0.8

/** Confidence when no route is determined. */
const CONFIDENCE_UNKNOWN = 0.0

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/** Route for world creation intent. */
const ROUTE_CREATE_WORLD: IntentRoute = 'create-world'

/** Route for unknown intent. */
const ROUTE_UNKNOWN: IntentRoute = 'unknown'

// ---------------------------------------------------------------------------
// Detection helpers
// ---------------------------------------------------------------------------

/**
 * Check if the input contains any creation keyword.
 */
function hasCreateKeyword(input: string): boolean {
  const lower = input.toLowerCase()
  return (
    lower.includes(KEYWORD_CREATE) ||
    input.includes(KEYWORD_CREATE_CN) ||
    input.includes(KEYWORD_GENERATE) ||
    lower.includes(KEYWORD_BUILD)
  )
}

/**
 * Check if the input contains any genre keyword.
 */
function hasGenreKeyword(input: string): boolean {
  const lower = input.toLowerCase()
  return (
    lower.includes(KEYWORD_MARIO) ||
    lower.includes(KEYWORD_FARM) ||
    lower.includes(KEYWORD_RPG) ||
    lower.includes(KEYWORD_SURVIVAL)
  )
}

// ---------------------------------------------------------------------------
// DefaultIntentRouter
// ---------------------------------------------------------------------------

/**
 * DefaultIntentRouter — rule-based natural language request routing.
 *
 * Scans the input for creation and genre-indicative keywords.
 * Returns a frozen IntentRoutingResult.
 */
export class DefaultIntentRouter implements IntentRouter {
  /**
   * Route a natural language input string to an IntentRoutingResult.
   *
   * @param input — raw user input string
   * @returns Frozen IntentRoutingResult with route and confidence
   */
  route(input: string): IntentRoutingResult {
    // Check for creation keywords
    const hasCreate = hasCreateKeyword(input)
    const hasGenre = hasGenreKeyword(input)

    if (hasCreate) {
      const confidence = hasGenre ? CONFIDENCE_DEFINITE : CONFIDENCE_STRONG
      return Object.freeze({ route: ROUTE_CREATE_WORLD, confidence })
    }

    return Object.freeze({ route: ROUTE_UNKNOWN, confidence: CONFIDENCE_UNKNOWN })
  }
}