import type { PromptAssemblySnapshot } from './PromptAssemblySnapshot'
import type { PromptInspector } from './PromptInspector'
import type { PromptInspectorBuilder } from './PromptInspectorBuilder'
import type { PromptInspectorSection } from './PromptInspectorSection'

/**
 * DefaultPromptInspectorBuilder — default implementation of PromptInspectorBuilder.
 *
 * Converts a PromptAssemblySnapshot into a PromptInspector by extracting:
 * - strategy name → inspector.strategy
 * - strategyRendered → "Rendered Strategy" section
 * - strategySelection → "Strategy Selection" section
 * - strategyModule → "Strategy Module" section
 * - plan → "Prompt Plan" section
 * - optimizedPlan → "Optimized Plan" section
 * - planDiff → "Plan Diff" section
 * - planRendered → "Rendered Plan" section
 *
 * Fields not in this mapping (including strategyModuleRendered) are ignored.
 * Sections are produced in a consistent order regardless of input field order.
 *
 * Properties:
 * - Pure: same snapshot always produces same inspector
 * - Stateless: no internal state between calls
 * - Deterministic: no randomness or external factors
 * - Immutable: never modifies the input snapshot
 * - Zero dependencies on Planner, Runtime, Provider, Memory, AgentLoop, or Pipeline
 *
 * Foundation only — not consumed by PromptBuilder yet.
 */
export class DefaultPromptInspectorBuilder implements PromptInspectorBuilder {
  build(snapshot: PromptAssemblySnapshot): PromptInspector {
    const sections: PromptInspectorSection[] = []

    // "Rendered Strategy" — content: strategyRendered string
    if (snapshot.strategyRendered !== undefined && snapshot.strategyRendered.length > 0) {
      sections.push({ title: 'Rendered Strategy', content: snapshot.strategyRendered })
    }

    // "Strategy Selection" — content: strategySelection metadata
    if (snapshot.strategySelection !== undefined) {
      sections.push({ title: 'Strategy Selection', content: snapshot.strategySelection })
    }

    // "Strategy Module" — content: strategyModule string
    if (snapshot.strategyModule !== undefined && snapshot.strategyModule.length > 0) {
      sections.push({ title: 'Strategy Module', content: snapshot.strategyModule })
    }

    // "Prompt Plan" — content: plan object
    if (snapshot.plan !== undefined) {
      sections.push({ title: 'Prompt Plan', content: snapshot.plan })
    }

    // "Optimized Plan" — content: optimizedPlan object
    if (snapshot.optimizedPlan !== undefined) {
      sections.push({ title: 'Optimized Plan', content: snapshot.optimizedPlan })
    }

    // "Plan Diff" — content: planDiff object
    if (snapshot.planDiff !== undefined) {
      sections.push({ title: 'Plan Diff', content: snapshot.planDiff })
    }

    // "Rendered Plan" — content: planRendered string
    if (snapshot.planRendered !== undefined && snapshot.planRendered.length > 0) {
      sections.push({ title: 'Rendered Plan', content: snapshot.planRendered })
    }

    return {
      strategy: snapshot.strategy,
      sections,
    }
  }
}