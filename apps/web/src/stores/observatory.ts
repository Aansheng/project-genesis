import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Observatory panels — the canonical navigation order for the Observatory Shell.
 * These are placeholders only; no viewer implementation exists yet (S6-001).
 */
export type ObservatoryPanel =
  | 'Overview'
  | 'Trace'
  | 'Timeline'
  | 'History'
  | 'Diff'
  | 'Runtime'
  | 'EventStream'
  | 'TraceGraph'
  | 'WorldGraph'
  | 'Generation'
  | 'Settings'

export const OBSERVATORY_PANELS: readonly ObservatoryPanel[] = [
  'Overview',
  'Trace',
  'Timeline',
  'History',
  'Diff',
  'Runtime',
  'EventStream',
  'TraceGraph',
  'WorldGraph',
  'Settings',
  'Generation',
]

/**
 * Observatory UI store (S6-001).
 *
 * Local UI state only — no routing logic, no backend coupling.
 * - selectedPanel: currently active sidebar panel
 * - status:        shell status badge
 */
export const useObservatoryStore = defineStore('observatory', () => {
  const selectedPanel = ref<ObservatoryPanel>('Overview')
  const status = ref('Ready')

  function selectPanel(panel: ObservatoryPanel): void {
    selectedPanel.value = panel
  }

  function setStatus(next: string): void {
    status.value = next
  }

  return {
    selectedPanel,
    status,
    selectPanel,
    setStatus,
  }
})
