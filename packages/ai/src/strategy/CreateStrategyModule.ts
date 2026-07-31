import type { StrategyModule } from './StrategyModule'
import type { PipelineContext } from '../pipeline/PipelineContext'
import type { PromptContext } from '../prompt/PromptContext'

const CREATE_GUIDELINES = `Creation Guidelines:

- Prefer creating new entities
- Avoid modifying existing entities`

/**
 * CreateStrategyModule — creation-oriented prompt content.
 *
 * Produces deterministic guidelines that steer the LLM toward creating
 * new entities rather than modifying existing ones when the strategy
 * is 'create'.
 *
 * Implements StrategyModule (which extends PromptModule).
 * Foundation only — not consumed by PromptBuilder yet.
 */
export class CreateStrategyModule implements StrategyModule {
  async build(_context: PipelineContext): Promise<string> {
    return CREATE_GUIDELINES
  }

  async buildContext(_context: PipelineContext): Promise<Partial<PromptContext>> {
    return { strategyRendered: CREATE_GUIDELINES }
  }
}
