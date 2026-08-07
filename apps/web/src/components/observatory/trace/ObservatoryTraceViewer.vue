<script setup lang="ts">
import { computed, ref } from 'vue'
import TraceList from './TraceList.vue'
import TraceDetails, { type Trace } from './TraceDetails.vue'

/**
 * Local mock trace data — layout validation only (WO-S6-003).
 * Will be replaced by real observatory trace data in a future work order.
 */
const MOCK_TRACES: readonly Trace[] = [
  {
    id: 'trace-1',
    strategy: 'create',
    timestamp: '12:00:01',
    plan: 'builder=DefaultPromptBuilder\nstrategy=create\nmodules=3\nstatus=assembled',
    snapshot: [
      { key: 'Module Count', value: '3' },
      { key: 'Resolver', value: 'assembly-resolver' },
      { key: 'Order', value: 'priority' },
    ],
    metadata: {
      builder: 'DefaultPromptBuilder',
      phase: '0.959977',
      modules: ['intent', 'entity', 'strategy'],
      status: 'assembled',
    },
  },
  {
    id: 'trace-2',
    strategy: 'modify',
    timestamp: '12:00:05',
    plan: 'builder=DefaultPromptBuilder\nstrategy=modify\nmodules=2\ndiff=1 updated',
    snapshot: [
      { key: 'Module Count', value: '2' },
      { key: 'Resolver', value: 'assembly-resolver' },
      { key: 'Diff', value: '1' },
    ],
    metadata: {
      builder: 'DefaultPromptBuilder',
      phase: '0.959977',
      modules: ['intent', 'strategy'],
      status: 'modified',
      diff: 1,
    },
  },
  {
    id: 'trace-3',
    strategy: 'query',
    timestamp: '12:00:09',
    plan: 'builder=DefaultPromptBuilder\nstrategy=query\nmodules=1\nstatus=resolved',
    snapshot: [
      { key: 'Module Count', value: '1' },
      { key: 'Resolver', value: 'assembly-resolver' },
      { key: 'Match', value: 'exact' },
    ],
    metadata: {
      builder: 'DefaultPromptBuilder',
      phase: '0.959977',
      modules: ['strategy'],
      status: 'resolved',
    },
  },
]

const selectedId = ref<string>(MOCK_TRACES[0].id)
const selectedTrace = computed<Trace | null>(
  () => MOCK_TRACES.find((t) => t.id === selectedId.value) ?? null,
)

function selectTrace(id: string): void {
  selectedId.value = id
}
</script>

<template>
  <div class="observatory-trace-viewer">
    <TraceList
      :traces="MOCK_TRACES"
      :selected-id="selectedId"
      @select="selectTrace"
    />
    <TraceDetails :trace="selectedTrace" />
  </div>
</template>

<style scoped>
.observatory-trace-viewer {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  min-width: 0;
  height: 100%;
  border: 1px solid var(--obs-border, #232327);
  border-radius: var(--obs-radius-m, 10px);
  background: var(--obs-surface, #111113);
  overflow: hidden;
}

:deep(.trace-details) {
  min-height: 0;
}
</style>