import type { RuntimeComponent } from './RuntimeComponent'

export interface Entity {
  id: string
  type: string
  x: number
  y: number
  /** Components attached to this Runtime entity — projected from DSL components. */
  readonly components?: readonly RuntimeComponent[]
}

export interface World {
  entities: Entity[]
}

export interface CreateEntityAction {
  type: 'CreateEntity'
  entityType: string
  x: number
  y: number
}

export interface MoveEntityAction {
  type: 'MoveEntity'
  id: string
  x: number
  y: number
}

export type Action = CreateEntityAction | MoveEntityAction