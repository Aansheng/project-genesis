import type { StrategyModule } from './StrategyModule'
import type { PipelineContext } from '../pipeline/PipelineContext'
import type { PromptContext } from '../prompt/PromptContext'

const QUERY_GUIDELINES = `Query Guidelines:

- Focus on retrieving information
- Avoid changing world state`

/**
 * QueryStrategyModule — query-oriented prompt content.
 *
 * Produces deterministic guidelines that steer the LLM toward retrieving
 * information rather than changing world state when the strategy is 'query'.
 *
 * Implements StrategyModule (which extends PromptModule).
 * Foundation only — not consumed by PromptBuilder yet.
 */
export class QueryStrategyModule implements StrategyModule {
  readonly name = 'query'

  async build(_context: PipelineContext): Promise<string> {
    return QUERY_GUIDELINES
  }

  async buildContext(_context: PipelineContext): Promise<Partial<PromptContext>> {
    return { strategyRendered: QUERY_GUIDELINES }
  }
}
