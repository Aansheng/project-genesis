import type { StrategyModule } from './StrategyModule'
import type { PipelineContext } from '../pipeline/PipelineContext'
import type { PromptContext } from '../prompt/PromptContext'

const MODIFY_GUIDELINES = `Modification Guidelines:

- Preserve entity identity
- Modify only requested properties`

/**
 * ModifyStrategyModule — modification-oriented prompt content.
 *
 * Produces deterministic guidelines that steer the LLM toward preserving
 * entity identity while modifying only requested properties when the
 * strategy is 'modify'.
 *
 * Implements StrategyModule (which extends PromptModule).
 * Foundation only — not consumed by PromptBuilder yet.
 */
export class ModifyStrategyModule implements StrategyModule {
  async build(_context: PipelineContext): Promise<string> {
    return MODIFY_GUIDELINES
  }

  async buildContext(_context: PipelineContext): Promise<Partial<PromptContext>> {
    return { strategyRendered: MODIFY_GUIDELINES }
  }
}
