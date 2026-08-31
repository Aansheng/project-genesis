import {
  createDefaultCollisionBoundsForType,
  createDefaultHealthComponentForType,
  createPositionComponent,
  createTargetDirectedMovementComponent,
  DEFAULT_TARGET_DIRECTED_MOVEMENT_SPEED,
  type Entity,
  type EntityCategory,
  type GameWorldEntity,
  type RuntimeComponent,
  type WorldType,
} from '@genesis/shared'

const SEMANTIC_COMPONENT_TYPE = 'semantic'
const POSITION_COMPONENT_TYPE = 'position'
const GROUND_Y = 400

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
  const baseX = CATEGORY_X[category] ?? 520
  const baseY = category === 'building' ? 304 : category === 'item' || category === 'quest' ? 384 : GROUND_Y
  const step = category === 'building' ? 112 : 72
  const start = hash(id) % 6

  for (let offset = 0; offset < 100; offset += 1) {
    const slot = (start + offset) % 100
    const candidate = Object.freeze({ x: baseX + slot * step, y: baseY })
    if (!occupied.has(positionKey(candidate))) return candidate
  }
  return Object.freeze({ x: baseX, y: baseY })
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
