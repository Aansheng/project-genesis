/**
 * DefaultIntentRouter — default implementation of IntentRouter.
 *
 * Routing rules:
 * - without an active world, contains "create", "创建", "生成", "generate", or "build" → route = create-world
 * - with an active world, entity-scoped mutation requests use world-evolution;
 *   a creation verb alone is not sufficient to replace the current world
 * - explicit new-world/reset semantics → route = create-world in either context
 * - additional genre keyword confidence boost:
 *   - contains "mario", "farm", "rpg", "survival", or "survivor" → confidence = 1.0 (with creation keyword)
 *   - creation keyword only (no genre keyword) → confidence = 0.8
 * - a supported evolution verb plus a known semantic target → route = world-evolution
 * - otherwise → route = unknown, confidence = 0.0
 *
 * Pure. Stateless. Deterministic. Immutable. Frozen output.
 */
import type { IntentRoute } from './IntentRoute'
import type { IntentRoutingResult } from './IntentRoutingResult'
import type { IntentRouter, IntentRoutingContext } from './IntentRouter'

// ---------------------------------------------------------------------------
// Creation keywords (lowercase)
// ---------------------------------------------------------------------------

/** English creation keyword. */
const KEYWORD_CREATE = 'create'

/** Chinese creation keyword. */
const KEYWORD_CREATE_CN = '创建'

/** Chinese generation keyword. */
const KEYWORD_GENERATE = '生成'

/** English generation keyword. */
const KEYWORD_GENERATE_EN = 'generate'

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

/** Common genre alias used by survivor-like games. */
const KEYWORD_SURVIVOR = 'survivor'

const EVOLUTION_KEYWORDS = [
  '把', '增加', '添加', '新增', '删除', '移除', '改成', '改为', '变成', '修改', '提升', '整个世界',
  'add', 'remove', 'delete', 'replace', 'change', 'update', 'turn', 'make',
] as const

/** Semantic anchors currently understood by the v1 evolution planner. */
const EVOLUTION_TARGET_KEYWORDS = [
  '牛', '羊', '商人', '机器人', '村民', '史莱姆', '骷髅', '狼', 'boss', '世界', '夜晚', '白天', '主题',
  'cow', 'sheep', 'merchant', 'robot', 'villager', 'slime', 'skeleton', 'wolf', 'world', 'night', 'day', 'theme',
] as const

/** Verbs that can mutate an entity collection in the active world. */
const ENTITY_MUTATION_KEYWORDS = [
  '创建', '生成', '新建', '增加', '添加', '新增',
  'create', 'generate', 'build', 'add',
] as const

/** Terms that make the object of a request the world/game rather than an entity. */
const WORLD_SCOPE_KEYWORDS = ['世界', '游戏', 'world', 'game'] as const

/** Generic quantity + entity shape; deliberately independent of entity names. */
const ENTITY_QUANTITY_PATTERN = /(?:\d+|一个|一|两个|两|三个|三|四个|四|五个|五|六个|六|七个|七|八个|八|九个|九|十个|十)\s*(?:个|只|名|枚|件|位)?\s*[a-z\u4e00-\u9fff]/iu

/** English quantity + entity shape, with word boundaries to avoid matching inside verbs. */
const ENGLISH_ENTITY_QUANTITY_PATTERN = /\b(?:a|an|one|two|three|four|five|six|seven|eight|nine|ten)\s+[a-z]/iu

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

/** Route for modifying the current semantic world. */
const ROUTE_WORLD_EVOLUTION: IntentRoute = 'world-evolution'

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
    lower.includes(KEYWORD_GENERATE_EN) ||
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
    lower.includes(KEYWORD_SURVIVAL) ||
    lower.includes(KEYWORD_SURVIVOR)
  )
}

function hasWorldScope(input: string): boolean {
  const lower = input.toLowerCase()
  return WORLD_SCOPE_KEYWORDS.some(keyword => lower.includes(keyword.toLowerCase())) || hasGenreKeyword(input)
}

function hasExplicitNewWorldIntent(input: string): boolean {
  const lower = input.toLowerCase()
  const worldScope = hasWorldScope(input)
  const chineseNewWorldMarker = input.includes('新建') || input.includes('全新') || input.includes('新的')
  const englishNewWorldMarker = lower.includes('start a new') || lower.includes('new world') || lower.includes('new game') || (lower.includes('new ') && worldScope)

  return (
    input.includes('重置') ||
    lower.includes('reset') ||
    lower.includes('rebuild') ||
    lower.includes('replace entire world') ||
    (input.includes('重新') && worldScope) ||
    (chineseNewWorldMarker && worldScope) ||
    englishNewWorldMarker
  )
}

function hasEntityMutationKeyword(input: string): boolean {
  const lower = input.toLowerCase()
  return ENTITY_MUTATION_KEYWORDS.some(keyword => lower.includes(keyword.toLowerCase()))
}

function hasEntityScopedMutation(input: string): boolean {
  return hasEntityMutationKeyword(input) && !hasWorldScope(input) && (
    ENTITY_QUANTITY_PATTERN.test(input) || ENGLISH_ENTITY_QUANTITY_PATTERN.test(input)
  )
}

function hasEvolutionKeyword(input: string): boolean {
  const lower = input.toLowerCase()
  return EVOLUTION_KEYWORDS.some(keyword => lower.includes(keyword.toLowerCase())) &&
    EVOLUTION_TARGET_KEYWORDS.some(keyword => lower.includes(keyword.toLowerCase()))
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
  route(input: string, context: IntentRoutingContext = {}): IntentRoutingResult {
    const hasCreate = hasCreateKeyword(input)
    const hasGenre = hasGenreKeyword(input)

    // New-world/reset language is the only creation override that is valid
    // when a current world is active.
    if (hasExplicitNewWorldIntent(input)) {
      const confidence = hasGenre ? CONFIDENCE_DEFINITE : CONFIDENCE_STRONG
      return Object.freeze({ route: ROUTE_CREATE_WORLD, confidence })
    }

    if (context.activeWorld === true) {
      // Entity-scoped requests must stay on the current world even when they
      // use a creation verb. Generic creation language remains unknown so the
      // active-world caller can use its World Evolution fallback safely.
      if (hasEntityScopedMutation(input) || hasEvolutionKeyword(input)) {
        return Object.freeze({ route: ROUTE_WORLD_EVOLUTION, confidence: CONFIDENCE_STRONG })
      }

      if (hasCreate) {
        return Object.freeze({ route: ROUTE_UNKNOWN, confidence: CONFIDENCE_UNKNOWN })
      }
    }

    // With no active world, preserve the original creation fast path.
    if (hasCreate) {
      const confidence = hasGenre ? CONFIDENCE_DEFINITE : CONFIDENCE_STRONG
      return Object.freeze({ route: ROUTE_CREATE_WORLD, confidence })
    }

    if (hasEvolutionKeyword(input)) {
      return Object.freeze({ route: ROUTE_WORLD_EVOLUTION, confidence: CONFIDENCE_STRONG })
    }

    return Object.freeze({ route: ROUTE_UNKNOWN, confidence: CONFIDENCE_UNKNOWN })
  }
}
