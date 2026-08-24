import type { RuntimeComponent } from '../RuntimeComponent'

export const HEALTH_COMPONENT_TYPE = 'health'

export interface HealthComponent {
  readonly type: 'health'
  readonly properties: {
    readonly current: number
    readonly max: number
  }
}

export function createHealthComponent(current = 100, max = 100): HealthComponent {
  const safeMax = Number.isFinite(max) && max > 0 ? max : 100
  const safeCurrent = Number.isFinite(current)
    ? Math.min(safeMax, Math.max(0, current))
    : safeMax
  return Object.freeze({
    type: HEALTH_COMPONENT_TYPE,
    properties: Object.freeze({ current: safeCurrent, max: safeMax }),
  }) as unknown as HealthComponent
}

export function isHealthComponent(
  component: RuntimeComponent,
): component is HealthComponent {
  return component.type === HEALTH_COMPONENT_TYPE
}

/** Add the generic Health primitive only to entities that can participate in combat. */
export function createDefaultHealthComponentForType(
  type: string,
): HealthComponent | undefined {
  return type === 'player' || type === 'enemy' || type === 'npc'
    ? createHealthComponent()
    : undefined
}
