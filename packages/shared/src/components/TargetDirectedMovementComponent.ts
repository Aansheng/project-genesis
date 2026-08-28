import type { RuntimeComponent } from '../RuntimeComponent'

/** Canonical type identifier for deterministic target-directed movement. */
export const TARGET_DIRECTED_MOVEMENT_COMPONENT_TYPE = 'target-directed-movement'

/** Default bounded speed used by the Survival composition. */
export const DEFAULT_TARGET_DIRECTED_MOVEMENT_SPEED = 1.5

/**
 * Declarative Runtime movement intent for one entity to follow another.
 *
 * The component contains identity and configuration only. Runtime systems own
 * target lookup, direction calculation, velocity, and position integration.
 */
export interface TargetDirectedMovementComponent {
  readonly type: 'target-directed-movement'
  readonly properties: {
    readonly targetEntityId: string
    readonly speed: number
  }
}

export function createTargetDirectedMovementComponent(
  targetEntityId: string,
  speed: number,
): TargetDirectedMovementComponent {
  return Object.freeze({
    type: TARGET_DIRECTED_MOVEMENT_COMPONENT_TYPE,
    properties: Object.freeze({ targetEntityId, speed }),
  }) as unknown as TargetDirectedMovementComponent
}

export function isTargetDirectedMovementComponent(
  component: RuntimeComponent,
): component is TargetDirectedMovementComponent {
  return component.type === TARGET_DIRECTED_MOVEMENT_COMPONENT_TYPE
}
