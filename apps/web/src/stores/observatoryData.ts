import { defineStore } from 'pinia'
import { ref } from 'vue'
import { DefaultObservatoryAdapter } from '../adapters/observatory'
import type { ObservatoryViewModel } from '../adapters/observatory'

// ---------------------------------------------------------------------------
// Local mock types (no AI package imports)
// ---------------------------------------------------------------------------

interface MockStep {
  id: string
  label: string
  status: string
}

interface MockTraceEntry {
  id: string
  label: string
  steps: MockStep[]
}

interface MockTimelineEntry {
  id: string
  label: string
  entries: { id: string; label: string; timestamp: string }[]
}

interface MockHistoryEntry {
  id: string
  label: string
  entries: { id: string; label: string; timestamp: string }[]
}

interface MockObservatory {
  trace: MockTraceEntry[]
  timeline: MockTimelineEntry[]
  history: MockHistoryEntry[]
  traceSnapshot: Record<string, unknown>
  timelineSnapshot: Record<string, unknown>
  historySnapshot: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Mock builder
// ---------------------------------------------------------------------------

/**
 * Build a local mock observatory object.
 *
 * Design rules:
 * - trace contains 3 entries (expected count = 3)
 * - timeline contains 5 entries (expected count = 5)
 * - history contains 2 entries (expected count = 2)
 * - all snapshot objects are present
 * - NO AI package types are imported
 */
function buildMockObservatory(): MockObservatory {
  return {
    trace: [
      {
        id: 'trace-001',
        label: 'Prompt Assembly Trace',
        steps: [
          { id: 'ts-001', label: 'Initialize', status: 'completed' },
          { id: 'ts-002', label: 'Validate Input', status: 'completed' },
        ],
      },
      {
        id: 'trace-002',
        label: 'Runtime Execution Trace',
        steps: [
          { id: 'ts-003', label: 'Plan', status: 'completed' },
          { id: 'ts-004', label: 'Execute', status: 'running' },
        ],
      },
      {
        id: 'trace-003',
        label: 'Validation Trace',
        steps: [
          { id: 'ts-005', label: 'Verify', status: 'pending' },
        ],
      },
    ],
    timeline: [
      {
        id: 'tl-001',
        label: 'Sprint 6 Start',
        entries: [{ id: 'te-001', label: 'Kickoff', timestamp: '2026-08-01T09:00:00Z' }],
      },
      {
        id: 'tl-002',
        label: 'Sprint 6 Mid',
        entries: [{ id: 'te-002', label: 'Review', timestamp: '2026-08-05T14:00:00Z' }],
      },
      {
        id: 'tl-003',
        label: 'Sprint 6 End',
        entries: [{ id: 'te-003', label: 'Retro', timestamp: '2026-08-10T17:00:00Z' }],
      },
      {
        id: 'tl-004',
        label: 'Release',
        entries: [{ id: 'te-004', label: 'Deploy', timestamp: '2026-08-11T10:00:00Z' }],
      },
      {
        id: 'tl-005',
        label: 'Post-Release',
        entries: [{ id: 'te-005', label: 'Monitor', timestamp: '2026-08-12T08:00:00Z' }],
      },
    ],
    history: [
      {
        id: 'hist-001',
        label: 'Observatory v1 Creation',
        entries: [{ id: 'he-001', label: 'Created', timestamp: '2026-07-01T10:00:00Z' }],
      },
      {
        id: 'hist-002',
        label: 'Observatory v1 Update',
        entries: [{ id: 'he-002', label: 'Updated', timestamp: '2026-08-01T10:00:00Z' }],
      },
    ],
    traceSnapshot: { stepCount: 5, status: 'completed' },
    timelineSnapshot: { entryCount: 5, status: 'active' },
    historySnapshot: { entryCount: 2, status: 'archived' },
  }
}

// ---------------------------------------------------------------------------
// Default ViewModel (empty observatory)
// ---------------------------------------------------------------------------

const adapter = new DefaultObservatoryAdapter()
const EMPTY_VIEW_MODEL = adapter.adapt(undefined)

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

/**
 * Observatory Data Store — owns the current ObservatoryViewModel.
 *
 * On load, builds a mock observatory and adapts it through
 * DefaultObservatoryAdapter to produce the ViewModel.
 *
 * Design principles:
 * - Pure data ownership: no UI logic, no rendering
 * - Adapter-driven: counts derived through DefaultObservatoryAdapter
 * - No AI package imports
 * - No Runtime integration
 * - No Planner integration
 */
export const useObservatoryDataStore = defineStore('observatoryData', () => {
  const viewModel = ref<ObservatoryViewModel>(EMPTY_VIEW_MODEL)

  /**
   * Load mock observatory data through the adapter.
   * Sets viewModel to the adapted result.
   */
  function loadMockObservatory(): void {
    const mock = buildMockObservatory()
    viewModel.value = adapter.adapt(mock)
  }

  return {
    viewModel,
    loadMockObservatory,
  }
})