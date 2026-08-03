import type { PromptAssemblyStrategyResolver } from './PromptAssemblyStrategyResolver'
import type { PromptAssemblyStrategy } from './PromptAssemblyStrategy'
import { DefaultPromptAssemblyStrategy } from './DefaultPromptAssemblyStrategy'
import { CreatePromptAssemblyStrategy } from './CreatePromptAssemblyStrategy'
import { QueryPromptAssemblyStrategy } from './QueryPromptAssemblyStrategy'
import { ModifyPromptAssemblyStrategy } from './ModifyPromptAssemblyStrategy'
import { DeletePromptAssemblyStrategy } from './DeletePromptAssemblyStrategy'

/**
 * DefaultPromptAssemblyStrategyResolver — default implementation of
 * PromptAssemblyStrategyResolver.
 *
 * Routes strategy names to their corresponding PromptAssemblyStrategy:
 * - 'create' → CreatePromptAssemblyStrategy
 * - 'query' → QueryPromptAssemblyStrategy
 * - 'modify' → ModifyPromptAssemblyStrategy
 * - 'delete' → DeletePromptAssemblyStrategy
 * - everything else → DefaultPromptAssemblyStrategy
 *
 * Properties:
 * - Pure: same strategyName always produces same strategy type
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies strategyName or external state
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 */
export class DefaultPromptAssemblyStrategyResolver implements PromptAssemblyStrategyResolver {
  resolve(strategyName: string): PromptAssemblyStrategy {
    switch (strategyName) {
      case 'create':
        return new CreatePromptAssemblyStrategy()
      case 'query':
        return new QueryPromptAssemblyStrategy()
      case 'modify':
        return new ModifyPromptAssemblyStrategy()
      case 'delete':
        return new DeletePromptAssemblyStrategy()
      default:
        return new DefaultPromptAssemblyStrategy()
    }
  }
}