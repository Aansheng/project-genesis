import {
  createDefaultCollisionBoundsForType,
  createDefaultHealthComponentForType,
  createPositionComponent,
  createTargetDirectedMovementComponent,
  DEFAULT_TARGET_DIRECTED_MOVEMENT_SPEED,
  isCollisionBoundsComponent,
  type Entity,
  type EntityCategory,
  type GameWorldEntity,
  type RuntimeComponent,
  type WorldType,
} from '@genesis/shared'

const SEMANTIC_COMPONENT_TYPE = 'semantic'
const POSITION_COMPONENT_TYPE = 'position'
const GROUND_Y = 400
const MAX_PLACEMENT_CANDIDATES = 100

/**
 * Two current top-down attack ranges. With the existing 32-unit Player and
 * Enemy Runtime collision envelopes this leaves a real approach window while
 * keeping the replacement in the established gameplay scale.
 */
export const DEFAULT_RUNTIME_PLACEMENT_MINIMUM_DISTANCE = 96

const FAIR_START_DIRECTIONS = Object.freeze([
  Object.freeze({ x: 1, y: 0 }),
  Object.freeze({ x: 0, y: 1 }),
  Object.freeze({ x: -1, y: 0 }),
  Object.freeze({ x: 0, y: -1 }),
])

interface RuntimePosition {
  readonly x: number
  readonly y: number
}

interface RuntimeBounds {
  readonly left: number
  readonly right: number
  readonly top: number
  readonly bottom: number
}

export interface RuntimeEntityPlacementOptions {
  /** Runtime entity IDs that must remain outside the fair-start boundary. */
  readonly protectedEntityIds: readonly string[]
  /** Center-to-center minimum distance; defaults to the current top-down scale. */
  readonly minimumDistance?: number
}

const CATEGORY_X: Readonly<Record<string, number>> = Object.freeze({
  npc: 100,
  enemy: 120,
  terrain: 160,
  building: 260,
  item: 360,
  quest: 440,
})

function semanticComponent(name: string, category: EntityCategory): RuntimeComponent {
  return Object.freeze({
    type: SEMANTIC_COMPONENT_TYPE,
    properties: Object.freeze({ category, name }),
  })
}

export function runtimeEntityPosition(entity: Entity): Readonly<{ x: number; y: number }> | undefined {
  const component = entity.components?.find(item => item.type === POSITION_COMPONENT_TYPE)
  if (!component) return undefined
  const { x, y } = component.properties
  return typeof x === 'number' && typeof y === 'number'
    ? Object.freeze({ x, y })
    : undefined
}

function positionKey(position: Readonly<{ x: number; y: number }>): string {
  return `${position.x}:${position.y}`
}

function hash(value: string): number {
  let result = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index)
    result = Math.imul(result, 16777619)
  }
  return result >>> 0
}

function boundsAtPosition(
  position: RuntimePosition,
  bounds: { readonly width: number; readonly height: number; readonly offsetX: number; readonly offsetY: number },
): RuntimeBounds | undefined {
  if (![position.x, position.y, bounds.width, bounds.height, bounds.offsetX, bounds.offsetY].every(Number.isFinite)) return undefined
  if (bounds.width <= 0 || bounds.height <= 0) return undefined

  const x = position.x + bounds.offsetX
  const y = position.y + bounds.offsetY
  return {
    left: x - bounds.width / 2,
    right: x + bounds.width / 2,
    top: y - bounds.height / 2,
    bottom: y + bounds.height / 2,
  }
}

function runtimeEntityBounds(entity: Entity): RuntimeBounds | undefined {
  const position = runtimeEntityPosition(entity)
  const collisionBounds = entity.components?.find(isCollisionBoundsComponent)
  return position && collisionBounds ? boundsAtPosition(position, collisionBounds.properties) : undefined
}

function candidateBounds(category: EntityCategory, position: RuntimePosition): RuntimeBounds | undefined {
  const collisionBounds = createDefaultCollisionBoundsForType(category)
  return collisionBounds ? boundsAtPosition(position, collisionBounds.properties) : undefined
}

function overlaps(first: RuntimeBounds, second: RuntimeBounds): boolean {
  return first.left < second.right
    && first.right > second.left
    && first.top < second.bottom
    && first.bottom > second.top
}

function categoryPosition(id: string, category: EntityCategory, offset: number): RuntimePosition {
  const baseX = CATEGORY_X[category] ?? 520
  const baseY = category === 'building' ? 304 : category === 'item' || category === 'quest' ? 384 : GROUND_Y
  const step = category === 'building' ? 112 : 72
  const start = hash(id) % 6
  const slot = (start + offset) % 100
  return Object.freeze({ x: baseX + slot * step, y: baseY })
}

function orderedFairStartDirections(id: string): readonly RuntimePosition[] {
  const start = hash(`${id}:fair-start`) % FAIR_START_DIRECTIONS.length
  return Object.freeze(FAIR_START_DIRECTIONS.map((_, index) =>
    FAIR_START_DIRECTIONS[(start + index) % FAIR_START_DIRECTIONS.length],
  ))
}

/** Deterministic bounded placement shared by semantic evolution and gameplay creation. */
export function findSafeRuntimeEntityPosition(
  world: readonly Entity[],
  id: string,
  category: EntityCategory,
): Readonly<{ x: number; y: number }> {
  const occupied = new Set(world.flatMap(entity => {
    const position = runtimeEntityPosition(entity)
    return position ? [positionKey(position)] : []
  }))
  for (let offset = 0; offset < MAX_PLACEMENT_CANDIDATES; offset += 1) {
    const candidate = categoryPosition(id, category, offset)
    if (!occupied.has(positionKey(candidate))) return candidate
  }
  return categoryPosition(id, category, 0)
}

/**
 * Find a deterministic Runtime position with bounded separation from current
 * protected Runtime entities. Relative candidates are tried first so a
 * replacement remains close enough for normal pursuit, then the existing
 * category sequence is used as a bounded deterministic fallback. The helper
 * never reads Renderer geometry and returns undefined rather than silently
 * placing an entity on a protected entity when no fair candidate exists.
 */
export function findRuntimeEntityPositionWithMinimumSeparation(
  world: readonly Entity[],
  id: string,
  category: EntityCategory,
  options: RuntimeEntityPlacementOptions,
): Readonly<{ x: number; y: number }> | undefined {
  const protectedIds = [...new Set(options.protectedEntityIds)].sort()
  if (protectedIds.length === 0) return undefined

  const protectedEntities = protectedIds.map(protectedId => world.find(entity => entity.id === protectedId))
  if (protectedEntities.some(entity => entity === undefined)) return undefined
  const protectedPositions = protectedEntities.map(entity => runtimeEntityPosition(entity!))
  if (protectedPositions.some(position => position === undefined)) return undefined

  const minimumDistance = Number.isFinite(options.minimumDistance) && (options.minimumDistance ?? 0) > 0
    ? options.minimumDistance!
    : DEFAULT_RUNTIME_PLACEMENT_MINIMUM_DISTANCE
  const occupied = new Set(world.flatMap(entity => {
    const position = runtimeEntityPosition(entity)
    return position ? [positionKey(position)] : []
  }))
  const candidates: RuntimePosition[] = []
  const candidateKeys = new Set<string>()

  protectedPositions.forEach(protectedPosition => {
    orderedFairStartDirections(id).forEach(direction => {
      const candidate = Object.freeze({
        x: protectedPosition!.x + direction.x * minimumDistance,
        y: protectedPosition!.y + direction.y * minimumDistance,
      })
      const key = positionKey(candidate)
      if (!candidateKeys.has(key)) {
        candidateKeys.add(key)
        candidates.push(candidate)
      }
    })
  })

  for (let offset = 0; offset < MAX_PLACEMENT_CANDIDATES; offset += 1) {
    const candidate = categoryPosition(id, category, offset)
    const key = positionKey(candidate)
    if (!candidateKeys.has(key)) {
      candidateKeys.add(key)
      candidates.push(candidate)
    }
  }

  for (const candidate of candidates) {
    if (![candidate.x, candidate.y].every(Number.isFinite)) continue
    if (occupied.has(positionKey(candidate))) continue

    const collisionBounds = candidateBounds(category, candidate)
    const isFair = protectedEntities.every((entity, index) => {
      const protectedPosition = protectedPositions[index]
      if (!protectedPosition) return false
      const distance = Math.hypot(candidate.x - protectedPosition.x, candidate.y - protectedPosition.y)
      if (!Number.isFinite(distance) || distance < minimumDistance) return false
      const protectedBounds = runtimeEntityBounds(entity!)
      return collisionBounds === undefined || protectedBounds === undefined || !overlaps(collisionBounds, protectedBounds)
    })
    if (isFair) return candidate
  }

  return undefined
}

/**
 * Compose one Runtime entity from semantic identity and current world type.
 * This is deliberately a narrow component recipe, not a prefab/factory system.
 */
export function createComposedRuntimeEntity(input: {
  readonly id: string
  readonly semanticEntity: Pick<GameWorldEntity, 'name' | 'category'>
  readonly position: Readonly<{ x: number; y: number }>
  readonly worldType: WorldType
  readonly targetEntityId?: string
}): Entity {
  const { id, semanticEntity, position, worldType, targetEntityId } = input
  const collisionBounds = createDefaultCollisionBoundsForType(semanticEntity.category)
  const health = worldType === 'survival'
    ? createDefaultHealthComponentForType(semanticEntity.category)
    : undefined
  const targetDirectedMovement = worldType === 'survival'
    && semanticEntity.category === 'enemy'
    && targetEntityId
    ? createTargetDirectedMovementComponent(targetEntityId, DEFAULT_TARGET_DIRECTED_MOVEMENT_SPEED)
    : undefined

  return Object.freeze({
    id,
    type: semanticEntity.category,
    x: 0,
    y: 0,
    components: Object.freeze([
      semanticComponent(semanticEntity.name, semanticEntity.category),
      createPositionComponent(position.x, position.y),
      ...(health ? [health] : []),
      ...(collisionBounds ? [collisionBounds] : []),
      ...(targetDirectedMovement ? [targetDirectedMovement] : []),
    ]),
  }) as unknown as Entity
}
