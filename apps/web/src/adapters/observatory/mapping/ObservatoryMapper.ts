import type { ObservatoryBridgeData } from '../bridge'

/**
 * ObservatoryMapper — maps ObservatoryBridgeData to an
 * adapter-compatible record.
 *
 * Resolves naming differences between bridge keys and adapter keys:
 *
 * | Bridge Key      | Adapter Key      | Action   |
 * |-----------------|------------------|----------|
 * | overview        | overview         | passthru |
 * | trace           | trace            | passthru |
 * | timeline        | timeline         | passthru |
 * | history         | history          | passthru |
 * | diff            | diffView         | rename   |
 * | runtime         | runtimeView      | rename   |
 * | eventStream     | eventStreamView  | rename   |
 *
 * Design principles:
 * - Pure: no side effects, no I/O
 * - Stateless: no mutable state between calls
 * - Deterministic: same input always produces same output
 * - Immutable: never mutates input, output is frozen
 */
export interface ObservatoryMapper {
  map(bridgeData: ObservatoryBridgeData): Record<string, unknown>
}