import type { RuntimeComponent } from '../RuntimeComponent'

export const VELOCITY_COMPONENT_TYPE = 'velocity'

export interface VelocityComponent {
  readonly type: 'velocity'
  readonly properties: {
    readonly x: number
    readonly y: number
  }
}

export function createVelocityComponent(x = 0, y = 0): VelocityComponent {
  return Object.freeze({
    type: VELOCITY_COMPONENT_TYPE,
    properties: Object.freeze({ x, y }),
  }) as unknown as VelocityComponent
}

export function isVelocityComponent(
  component: RuntimeComponent,
): component is VelocityComponent {
  return component.type === VELOCITY_COMPONENT_TYPE
}
