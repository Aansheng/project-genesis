import type { GenerationContextMetadata } from '@genesis/shared'
import { DefaultGameplayGenerationContextBuilder } from '@genesis/shared'
import type { GameDesignPrompt } from '../game-world/generation/GameDesignPromptBuilder'
import type { GameplayGenerationRequest } from './GameplayGenerationRequest'

export interface GameplayPromptBuilder {
  build(request: GameplayGenerationRequest): GameDesignPrompt
}

const list = (values: readonly string[]): string => values.join(', ')

/** Vendor-neutral gameplay prompt assembly; output remains structured intent. */
export class DefaultGameplayPromptBuilder implements GameplayPromptBuilder {
  build(request: GameplayGenerationRequest): GameDesignPrompt {
    const context = new DefaultGameplayGenerationContextBuilder().build({
      metadata: request.context,
      semanticWorld: {
        worldType: request.context.game.worldType,
        entities: request.context.semanticWorld.entities,
      },
      capabilities: request.context.capabilities,
      instruction: request.context.instruction || request.input,
      ...(request.context.currentGameplaySpecification !== undefined
        ? { currentGameplaySpecification: request.context.currentGameplaySpecification }
        : {}),
    })
    const system = [
      'You are a gameplay design planner for Project Genesis.',
      'Describe how the current semantic world should play; do not execute rules.',
      'Return structured JSON only. Do not return Markdown, TypeScript, JavaScript, explanations, reasoning, or hidden chain-of-thought.',
      'The candidate shape is {gameLoop, playerMechanics, mechanics, interactions?, progression?, goals?, failureConditions?, spawnRules?}.',
      'Mechanic IDs must be stable identity in kebab-case, not presentation labels or random IDs.',
      'Reference only semantic entity IDs present in the current world.',
      `Genesis currently supports these mechanic IDs: ${list(context.capabilities.supportedMechanicIds)}.`,
      'Mark desired but not currently executable mechanics as deferred; the provider cannot promote unsupported capabilities to supported.',
      'Do not generate engine code, Runtime systems, triggers, conditions, actions, timers, or executable scripts.',
      'Prefer a coherent small loop over a large feature list.',
    ].join('\n')
    const user = JSON.stringify({
      gameIntent: context.instruction,
      currentWorld: context.semanticWorld,
      capabilities: context.capabilities,
      currentGameplay: context.currentGameplaySpecification,
      output: 'structured gameplay candidate only',
    })
    return Object.freeze({
      system,
      user,
      generationContext: context as GenerationContextMetadata,
    })
  }
}
