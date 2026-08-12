/**
 * PromptObservatoryMetadata — strongly typed metadata contract for the
 * Observatory layer.
 *
 * Defines the root interface that will serve as the future integration
 * point between PromptBuilder and Observatory.
 *
 * All fields are optional and readonly. Payloads are unknown — no coupling
 * to ViewModel, UI, or web package types.
 *
 * Design principles:
 * - Immutable (readonly fields, consumers should freeze at runtime)
 * - Fully optional (empty object is valid)
 * - Opaque slots (unknown — no ViewModel or UI type imports)
 * - No web package dependencies
 * - No AI package internal coupling beyond this file
 */
export interface PromptObservatoryMetadata {
  /** Optional overview section — opaque payload */
  readonly overview?: unknown

  /** Optional trace section — opaque payload */
  readonly trace?: unknown

  /** Optional timeline section — opaque payload */
  readonly timeline?: unknown

  /** Optional history section — opaque payload */
  readonly history?: unknown

  /** Optional diff section — opaque payload */
  readonly diff?: unknown

  /** Optional runtime section — opaque payload */
  readonly runtime?: unknown

  /** Optional event stream section — opaque payload */
  readonly eventStream?: unknown
}