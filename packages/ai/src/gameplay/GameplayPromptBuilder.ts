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
      'The candidate shape is {gameLoop, playerMechanics, mechanics, interactions?, progression?, goals?, failureConditions?, spawnRules?, rules?}.',
      'Mechanic IDs must be stable identity in kebab-case, not presentation labels or random IDs.',
      'Reference only semantic entity IDs present in the current world.',
      `Genesis currently supports these mechanic IDs: ${list(context.capabilities.supportedMechanicIds)}.`,
      `Allowed GameplayEvent types: ${list(context.ruleVocabulary.eventTypes)}.`,
      `Allowed condition types: ${list(context.ruleVocabulary.conditionTypes)}.`,
      `Allowed action types: ${list(context.ruleVocabulary.actionTypes)}.`,
      'Rules are data only: do not output functions, code, scripts, eval, expressions, or provider-specific payloads.',
      'Do not generate engine code, Runtime systems, or executable scripts.',
      'Do not invent TIMER_ELAPSED or any event type absent from the allowed vocabulary.',
      'Use eventActor/eventTarget, exactEntityId, category, or current semantic name/archetype selectors; never infer semantics from an ID prefix.',
      'Mark desired but not currently executable mechanics as deferred; the provider cannot promote unsupported capabilities to supported.',
      'Rules describe intent only. Runtime Trigger/Condition/Action execution is not active in this work order.',
      'Prefer a coherent small loop over a large feature list.',
    ].join('\n')
    const user = JSON.stringify({
      gameIntent: context.instruction,
      currentWorld: context.semanticWorld,
      capabilities: context.capabilities,
      ruleVocabulary: context.ruleVocabulary,
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
