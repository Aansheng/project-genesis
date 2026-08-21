import type { RuntimeComponent } from '../RuntimeComponent'

export const COLLISION_BOUNDS_COMPONENT_TYPE = 'collision-bounds'

export interface CollisionBoundsComponent {
  readonly type: 'collision-bounds'
  readonly properties: {
    readonly width: number
    readonly height: number
    readonly offsetX: number
    readonly offsetY: number
  }
}

export function createCollisionBoundsComponent(
  width: number,
  height: number,
  offsetX = 0,
  offsetY = 0,
): CollisionBoundsComponent {
  return Object.freeze({
    type: COLLISION_BOUNDS_COMPONENT_TYPE,
    properties: Object.freeze({ width, height, offsetX, offsetY }),
  }) as unknown as CollisionBoundsComponent
}

export function isCollisionBoundsComponent(
  component: RuntimeComponent,
): component is CollisionBoundsComponent {
  return component.type === COLLISION_BOUNDS_COMPONENT_TYPE
}

/**
 * Small Runtime-owned contact envelopes. They are gameplay geometry, not
 * renderer dimensions, and are used only when observing entity contact.
 */
export function createDefaultCollisionBoundsForType(
  type: string,
): CollisionBoundsComponent | undefined {
  const sizes: Readonly<Record<string, readonly [number, number]>> = {
    player: [32, 48],
    enemy: [32, 32],
    item: [24, 24],
    quest: [32, 48],
    npc: [32, 48],
    building: [96, 96],
  }
  const size = sizes[type]
  return size ? createCollisionBoundsComponent(size[0], size[1]) : undefined
}
