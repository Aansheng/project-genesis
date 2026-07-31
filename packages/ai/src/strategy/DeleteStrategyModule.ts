import type { StrategyModule } from './StrategyModule'
import type { PipelineContext } from '../pipeline/PipelineContext'
import type { PromptContext } from '../prompt/PromptContext'

const DELETE_GUIDELINES = `Deletion Guidelines:

- Confirm target existence
- Remove only requested entities`

/**
 * DeleteStrategyModule — deletion-oriented prompt content.
 *
 * Produces deterministic guidelines that steer the LLM toward confirming
 * target existence and removing only requested entities when the strategy
 * is 'delete'.
 *
 * Implements StrategyModule (which extends PromptModule).
 * Foundation only — not consumed by PromptBuilder yet.
 */
export class DeleteStrategyModule implements StrategyModule {
  async build(_context: PipelineContext): Promise<string> {
    return DELETE_GUIDELINES
  }

  async buildContext(_context: PipelineContext): Promise<Partial<PromptContext>> {
    return { strategyRendered: DELETE_GUIDELINES }
  }
}
