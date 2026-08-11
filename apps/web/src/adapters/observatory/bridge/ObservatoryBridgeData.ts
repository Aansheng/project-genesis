/**
 * ObservatoryBridgeData — immutable result type produced by the Metadata Bridge.
 *
 * Each field is an optional "unknown" slot that will be consumed by
 * DefaultObservatoryAdapter's existing adapt methods. Having the fields
 * be unknown forces the adapter to validate each section independently.
 *
 * Design principles:
 * - Immutable (readonly fields)
 * - Fully optional (empty object is valid)
 * - Opaque slots (unknown — no coupling to PromptAssembly types)
 * - Frozen at runtime
 */
export interface ObservatoryBridgeData {
  readonly overview?: unknown
  readonly trace?: unknown
  readonly timeline?: unknown
  readonly history?: unknown
  readonly diff?: unknown
  readonly runtime?: unknown
  readonly eventStream?: unknown
}

/** Default empty bridge data — used when input is null/undefined/invalid. */
export const EMPTY_BRIDGE_DATA: ObservatoryBridgeData = Object.freeze({})