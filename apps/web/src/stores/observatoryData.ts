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

interface MockTimelineViewEntry {
  index: number
  strategy: string
}

interface MockTimelineViewItem {
  id: string
  entries: MockTimelineViewEntry[]
}

interface MockHistoryViewEvolutionEntry {
  name: string
}

interface MockHistoryViewEntry {
  id: string
  timestamp: string
  prompt: string
  result: string
  evolution: MockHistoryViewEvolutionEntry[]
}

interface MockDiffViewChangeEntry {
  name: string
}

interface MockDiffViewEntry {
  id: string
  timestamp: string
  added: (string | MockDiffViewChangeEntry)[]
  removed: (string | MockDiffViewChangeEntry)[]
  changed: (string | MockDiffViewChangeEntry)[]
}

interface MockRuntimeCompEntry {
  name: string
  data: Record<string, unknown>
}

interface MockRuntimeEntityEntry {
  id: string
  type: string
  position: string
  health: number
  state: string
  components: MockRuntimeCompEntry[]
}

interface MockRuntimeViewEntry {
  worldId: string
  entityCount: number
  systemCount: number
  eventCount: number
  fps: number
  entities: MockRuntimeEntityEntry[]
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
  traceView: MockTraceViewEntry[]
  timelineView: MockTimelineViewItem[]
  historyView: MockHistoryViewEntry[]
  diffView: MockDiffViewEntry[]
  runtimeView: MockRuntimeViewEntry
  eventStreamView: MockEventStreamEntry
  timeline: MockTimelineEntry[]
  history: MockHistoryEntry[]
  traceSnapshot: Record<string, unknown>
  timelineSnapshot: Record<string, unknown>
  historySnapshot: Record<string, unknown>
}

interface MockTraceViewSnapshotEntry {
  key: string
  value: string
}

interface MockTraceViewEntry {
  id: string
  strategy: string
  timestamp: string
  plan: string
  snapshot: MockTraceViewSnapshotEntry[]
  metadata: Record<string, unknown>
}

interface MockEventStreamEntry {
  events: MockEventStreamEventEntry[]
}

interface MockEventStreamEventEntry {
  id: string
  timestamp: string
  level: 'info' | 'warning' | 'error'
  source: string
  message: string
}

// ---------------------------------------------------------------------------
// Mock builder
// ---------------------------------------------------------------------------

/**
 * Build a local mock observatory object.
 *
 * Design rules:
 * - trace contains 3 entries (expected count = 3)
 * - traceView contains 3 entries: CreateWorld, GenerateTerrain, CreateFarm
 * - timelineView contains 3 entries: timeline-001 (5 entries), timeline-002 (3 entries), timeline-003 (4 entries)
 * - historyView contains 3 entries: history-001 (5 evolution entries), history-002 (3), history-003 (2)
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
    traceView: [
      {
        id: 'trace-001',
        strategy: 'CreateWorld',
        timestamp: '10:00:01',
        plan: 'builder=DefaultPromptBuilder\nstrategy=create\nmodules=3\nstatus=assembled',
        snapshot: [
          { key: 'Module Count', value: '3' },
          { key: 'Strategy', value: 'CreateWorld' },
        ],
        metadata: {
          builder: 'DefaultPromptBuilder',
          phase: '0.959977',
          modules: ['intent', 'entity', 'strategy'],
          status: 'assembled',
        },
      },
      {
        id: 'trace-002',
        strategy: 'GenerateTerrain',
        timestamp: '10:00:05',
        plan: 'builder=DefaultPromptBuilder\nstrategy=modify\nmodules=2\nstatus=modified',
        snapshot: [
          { key: 'Module Count', value: '2' },
          { key: 'Strategy', value: 'GenerateTerrain' },
        ],
        metadata: {
          builder: 'DefaultPromptBuilder',
          phase: '0.959977',
          modules: ['intent', 'strategy'],
          status: 'modified',
        },
      },
      {
        id: 'trace-003',
        strategy: 'CreateFarm',
        timestamp: '10:00:09',
        plan: 'builder=DefaultPromptBuilder\nstrategy=query\nmodules=1\nstatus=resolved',
        snapshot: [
          { key: 'Module Count', value: '1' },
          { key: 'Strategy', value: 'CreateFarm' },
        ],
        metadata: {
          builder: 'DefaultPromptBuilder',
          phase: '0.959977',
          modules: ['strategy'],
          status: 'resolved',
        },
      },
    ],
    timelineView: [
      {
        id: 'timeline-001',
        entries: [
          { index: 0, strategy: 'CreateWorld' },
          { index: 1, strategy: 'GenerateTerrain' },
          { index: 2, strategy: 'CreateFarm' },
          { index: 3, strategy: 'CreateNPC' },
          { index: 4, strategy: 'CreateQuest' },
        ],
      },
      {
        id: 'timeline-002',
        entries: [
          { index: 0, strategy: 'MoveEntity' },
          { index: 1, strategy: 'QueryWorld' },
          { index: 2, strategy: 'UpdateEntity' },
        ],
      },
      {
        id: 'timeline-003',
        entries: [
          { index: 0, strategy: 'DestroyEntity' },
          { index: 1, strategy: 'CreateEntity' },
          { index: 2, strategy: 'QueryWorld' },
          { index: 3, strategy: 'MoveEntity' },
        ],
      },
    ],
    historyView: [
      {
        id: 'history-001',
        timestamp: '10:00:00',
        prompt: 'Create Farm Game',
        result: 'Farm Created',
        evolution: [
          { name: 'CreateWorld' },
          { name: 'GenerateTerrain' },
          { name: 'CreateFarm' },
          { name: 'CreateNPC' },
          { name: 'CreateQuest' },
        ],
      },
      {
        id: 'history-002',
        timestamp: '10:05:00',
        prompt: 'Add Villagers',
        result: '3 villagers added',
        evolution: [
          { name: 'CreateVillager' },
          { name: 'AssignTask' },
          { name: 'StartWork' },
        ],
      },
      {
        id: 'history-003',
        timestamp: '10:10:00',
        prompt: 'Build Defenses',
        result: 'Walls constructed',
        evolution: [
          { name: 'BuildWall' },
          { name: 'PlaceGuard' },
        ],
      },
    ],
    diffView: [
      {
        id: 'diff-001',
        timestamp: '12:00:01',
        added: ['Tavern', 'Villager-1', 'Villager-2'],
        removed: [],
        changed: ['VillageCenter'],
      },
      {
        id: 'diff-002',
        timestamp: '12:05:00',
        added: ['Farm-1', 'Farm-2'],
        removed: [],
        changed: [],
      },
      {
        id: 'diff-003',
        timestamp: '12:08:00',
        added: ['Guard-1', 'Guard-2'],
        removed: ['OldRoad'],
        changed: ['VillageGate'],
      },
    ],
    runtimeView: {
      worldId: 'world-001',
      entityCount: 187,
      systemCount: 8,
      eventCount: 31,
      fps: 60,
      entities: [
        {
          id: 'guard-001',
          type: 'Guard',
          position: '(10,4)',
          health: 100,
          state: 'Patrol',
          components: [
            { name: 'Position', data: { x: 10, y: 4 } },
            { name: 'Health', data: { current: 100, max: 100 } },
            { name: 'AI', data: { state: 'Patrol', target: null } },
          ],
        },
        {
          id: 'merchant-001',
          type: 'Merchant',
          position: '(4,8)',
          health: 100,
          state: 'Trading',
          components: [
            { name: 'Position', data: { x: 4, y: 8 } },
            { name: 'Health', data: { current: 100, max: 100 } },
            { name: 'Inventory', data: { gold: 250, items: ['potion', 'sword', 'shield'] } },
            { name: 'AI', data: { state: 'Trading', target: null } },
          ],
        },
        {
          id: 'villager-001',
          type: 'Villager',
          position: '(1,2)',
          health: 100,
          state: 'Working',
          components: [
            { name: 'Position', data: { x: 1, y: 2 } },
            { name: 'Health', data: { current: 100, max: 100 } },
            { name: 'Inventory', data: { gold: 50, items: ['bread'] } },
            { name: 'AI', data: { state: 'Working', target: 'farm-001' } },
            { name: 'Schedule', data: { wakeHour: 6, sleepHour: 20, task: 'harvest' } },
          ],
        },
      ],
    },
    eventStreamView: {
      events: [
        { id: 'evt-001', timestamp: '12:00:01', level: 'info', source: 'PromptBuilder', message: 'Prompt received' },
        { id: 'evt-002', timestamp: '12:00:02', level: 'info', source: 'StrategyResolver', message: 'Strategy selected' },
        { id: 'evt-003', timestamp: '12:00:03', level: 'info', source: 'Planner', message: 'Plan generated' },
        { id: 'evt-004', timestamp: '12:00:04', level: 'warning', source: 'Runtime', message: 'Entity spawn delayed' },
        { id: 'evt-005', timestamp: '12:00:05', level: 'error', source: 'Provider', message: 'Response timeout' },
        { id: 'evt-006', timestamp: '12:00:06', level: 'info', source: 'PromptBuilder', message: 'Prompt validated' },
        { id: 'evt-007', timestamp: '12:00:07', level: 'info', source: 'Memory', message: 'Context loaded' },
        { id: 'evt-008', timestamp: '12:00:08', level: 'warning', source: 'Runtime', message: 'NPC path recalculated' },
        { id: 'evt-009', timestamp: '12:00:09', level: 'info', source: 'Planner', message: 'Plan optimized' },
        { id: 'evt-010', timestamp: '12:00:10', level: 'error', source: 'Provider', message: 'Stream interrupted' },
        { id: 'evt-011', timestamp: '12:00:11', level: 'info', source: 'Runtime', message: 'Villager arrived at Tavern' },
        { id: 'evt-012', timestamp: '12:00:12', level: 'warning', source: 'AI', message: 'Context compression threshold reached' },
        { id: 'evt-013', timestamp: '12:00:13', level: 'info', source: 'Provider', message: 'Stream chunk received' },
        { id: 'evt-014', timestamp: '12:00:14', level: 'info', source: 'Runtime', message: 'Guard patrol route updated' },
        { id: 'evt-015', timestamp: '12:00:15', level: 'error', source: 'Planner', message: 'Plan validation failed' },
        { id: 'evt-016', timestamp: '12:00:16', level: 'info', source: 'AI', message: 'Prompt rendered' },
        { id: 'evt-017', timestamp: '12:00:17', level: 'warning', source: 'Runtime', message: 'Merchant stock low' },
        { id: 'evt-018', timestamp: '12:00:18', level: 'info', source: 'Provider', message: 'Response completed' },
        { id: 'evt-019', timestamp: '12:00:19', level: 'info', source: 'Runtime', message: 'Farm harvested' },
        { id: 'evt-020', timestamp: '12:00:20', level: 'info', source: 'Planner', message: 'ModifyStrategy applied' },
      ],
    },
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