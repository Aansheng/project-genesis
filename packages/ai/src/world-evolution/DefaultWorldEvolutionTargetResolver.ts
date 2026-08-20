import type {
  EntityCategory,
  EvolutionEntitySemantic,
  EvolutionTargetSelector,
  GameWorldEntity,
  WorldEvolutionRequest,
} from '@genesis/shared'
import type {
  WorldEvolutionSemanticResolution,
  WorldEvolutionTargetResolution,
  WorldEvolutionTargetResolver,
} from './WorldEvolutionPlanner'

const CATEGORIES: readonly EntityCategory[] = ['player', 'npc', 'enemy', 'terrain', 'building', 'item', 'quest']

const ALIASES: Readonly<Record<string, string>> = Object.freeze({
  cow: 'cow', cows: 'cow', 牛: 'cow', 奶牛: 'cow',
  sheep: 'sheep', 羊: 'sheep',
  merchant: 'merchant', 商人: 'merchant',
  villager: 'villager', villagers: 'villager', 村民: 'villager',
  farmer: 'farmer', 农夫: 'farmer', 农民: 'farmer',
  slime: 'slime', slimes: 'slime', 史莱姆: 'slime',
  skeleton: 'skeleton', 骷髅: 'skeleton',
  wolf: 'wolf', wolves: 'wolf', 狼: 'wolf',
  boss: 'boss', Boss: 'boss', 首领: 'boss',
  robot: 'robot', 机器人: 'robot',
  player: 'player', 玩家: 'player',
})

const KNOWN_SEMANTICS: Readonly<Record<string, { readonly name: string; readonly category: EntityCategory }>> = Object.freeze({
  cow: { name: 'Cow', category: 'npc' },
  sheep: { name: 'Sheep', category: 'npc' },
  merchant: { name: 'Merchant', category: 'npc' },
  villager: { name: 'Villager', category: 'npc' },
  farmer: { name: 'Farmer', category: 'npc' },
  slime: { name: 'Slime', category: 'enemy' },
  skeleton: { name: 'Skeleton', category: 'enemy' },
  wolf: { name: 'Wolf', category: 'enemy' },
  boss: { name: 'Boss', category: 'enemy' },
  robot: { name: 'Robot', category: 'npc' },
  player: { name: 'Player', category: 'player' },
})

function normalize(value: string): string {
  const trimmed = value.trim().toLocaleLowerCase()
  return ALIASES[trimmed] ?? trimmed.replace(/[\s_-]+/gu, '')
}

function matchesSemantic(entity: GameWorldEntity, semantic: string): boolean {
  const expected = normalize(semantic)
  return normalize(entity.name) === expected || normalize(entity.id) === expected
}

function isCategory(value: unknown): value is EntityCategory {
  return typeof value === 'string' && CATEGORIES.includes(value as EntityCategory)
}

/** Resolves AI selectors against the current semantic snapshot, never Runtime/Pixi state. */
export class DefaultWorldEvolutionTargetResolver implements WorldEvolutionTargetResolver {
  resolveTargets(
    target: EvolutionTargetSelector,
    request: WorldEvolutionRequest,
  ): WorldEvolutionTargetResolution {
    const world = request.context.semanticWorld
    if (target.entityId?.trim()) {
      const entity = world.entities.find(item => item.id === target.entityId)
      return entity
        ? Object.freeze({ status: 'resolved', targetIds: Object.freeze([entity.id]) })
        : Object.freeze({ status: 'unresolved', targetIds: Object.freeze([]), reason: 'target entity does not exist in the current world' })
    }

    const semantic = target.semantic?.trim()
    const category = target.category
    if (!semantic && !category) {
      return Object.freeze({ status: 'unresolved', targetIds: Object.freeze([]), reason: 'target selector has no semantic or category' })
    }
    const matches = world.entities.filter(entity =>
      (semantic === undefined || matchesSemantic(entity, semantic)) &&
      (category === undefined || entity.category === category),
    )
    if (matches.length === 0) {
      return Object.freeze({ status: 'unresolved', targetIds: Object.freeze([]), reason: 'no current semantic entity matches the selector' })
    }
    const match = target.match ?? 'one'
    if (match === 'all') {
      return Object.freeze({ status: 'resolved', targetIds: Object.freeze(matches.map(entity => entity.id)) })
    }
    if (matches.length !== 1) {
      return Object.freeze({ status: 'ambiguous', targetIds: Object.freeze(matches.map(entity => entity.id)), reason: 'more than one current entity matches the selector' })
    }
    return Object.freeze({ status: 'resolved', targetIds: Object.freeze([matches[0]!.id]) })
  }

  resolveSemantic(
    semantic: EvolutionEntitySemantic,
    fallbackCategory?: EntityCategory,
  ): WorldEvolutionSemanticResolution {
    const key = normalize(semantic.name)
    const known = KNOWN_SEMANTICS[key]
    const category = semantic.category ?? fallbackCategory ?? known?.category
    if (!semantic.name.trim() || !category || !isCategory(category)) {
      return Object.freeze({ status: 'unresolved', reason: 'replacement semantic needs a supported category' })
    }
    return Object.freeze({
      status: 'resolved',
      semantic: Object.freeze({
        name: known?.name ?? semantic.name.trim(),
        category,
        ...(semantic.role?.trim() ? { role: semantic.role.trim() } : {}),
      }),
    })
  }
}
