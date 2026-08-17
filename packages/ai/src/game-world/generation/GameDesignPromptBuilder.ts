import type { EntityCategory, GameDifficulty, GameObjectiveType, WorldType } from '@genesis/shared'
import type { GameIntent } from '../../game-intent/GameIntent'
import type { GameWorldGenerationRequest } from './GameWorldGenerationRequest'

export interface GameDesignCapabilities {
  readonly supportedGenres: readonly WorldType[]
  readonly supportedEntityCategories: readonly EntityCategory[]
  readonly supportedDifficulties: readonly GameDifficulty[]
  readonly supportedObjectiveTypes: readonly GameObjectiveType[]
  readonly realizedSemantics: readonly string[]
  readonly preservedSemantics: readonly string[]
}

export interface GameDesignPrompt {
  readonly system: string
  readonly user: string
}

export interface GameDesignPromptBuilder {
  build(request: GameWorldGenerationRequest): GameDesignPrompt
}

export const DEFAULT_GAME_DESIGN_CAPABILITIES: GameDesignCapabilities = Object.freeze({
  supportedGenres: Object.freeze(['farm', 'platformer', 'rpg', 'survival', 'sandbox'] as const),
  supportedEntityCategories: Object.freeze(['player', 'npc', 'enemy', 'terrain', 'building', 'item', 'quest'] as const),
  supportedDifficulties: Object.freeze(['easy', 'medium', 'hard'] as const),
  supportedObjectiveTypes: Object.freeze(['reach-goal', 'defeat-boss', 'collect-item', 'survive'] as const),
  realizedSemantics: Object.freeze(['genre', 'entity id', 'entity category', 'entity name']),
  preservedSemantics: Object.freeze(['title', 'theme', 'difficulty', 'objectives', 'entity role']),
})

const list = (values: readonly string[]) => values.join(', ')

/** Pure, vendor-independent assembly of the semantic game-design prompt. */
export class DefaultGameDesignPromptBuilder implements GameDesignPromptBuilder {
  constructor(private readonly capabilities: GameDesignCapabilities = DEFAULT_GAME_DESIGN_CAPABILITIES) {}

  build(request: GameWorldGenerationRequest): GameDesignPrompt {
    const { capabilities } = this
    const system = [
      'You are a game design planner for Project Genesis.',
      'Convert the user request into one semantic game design candidate. Do not implement engine code.',
      'Return structured JSON only. Do not use Markdown, explanations, reasoning, implementation notes, or extra fields.',
      'The candidate shape is {title?, genre?, theme?: {name}, difficulty?, objectives?: [{type, target?}], entities: [{id, category, name, role?}]}.' ,
      `Supported genres: ${list(capabilities.supportedGenres)}.`,
      `Supported entity categories: ${list(capabilities.supportedEntityCategories)}.`,
      `Supported difficulties: ${list(capabilities.supportedDifficulties)}.`,
      `Supported objective types: ${list(capabilities.supportedObjectiveTypes)}.`,
      'Use semantic values only: never emit coordinates, components, velocity, renderer styles, asset paths, shaders, physics, quest scripts, or code.',
      `Currently realized by the world builder: ${list(capabilities.realizedSemantics)}.`,
      `Preserve but do not pretend to execute: ${list(capabilities.preservedSemantics)}.`,
      'If a requested feature is outside this contract, omit its implementation details and keep only supported semantic information.',
      'Do not expose chain-of-thought; return only the final candidate.',
    ].join('\n')
    const user = JSON.stringify({
      request: request.input,
      intent: request.intent as GameIntent,
    })
    return Object.freeze({ system, user })
  }
}
