<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from '../../../stores/i18n'
import { useObservatoryDataStore } from '../../../stores/observatoryData'
import RuntimeEntityList from './RuntimeEntityList.vue'
import RuntimeEntityDetails from './RuntimeEntityDetails.vue'
import RuntimeEntityInspector from './RuntimeEntityInspector.vue'
import RuntimeStatCard from './RuntimeStatCard.vue'
import type { RuntimeViewModel, RuntimeEntityViewModel } from '../../../adapters/observatory'

const dataStore = useObservatoryDataStore()
const i18n = useI18n()
const testMode = import.meta.env.MODE === 'test'

const runtimeView = computed<RuntimeViewModel>(
  () => dataStore.viewModel.runtimeView,
)

const selectedId = ref<string>('')
const entities = computed<readonly RuntimeEntityViewModel[]>(
  () => runtimeView.value.entities,
)

// Initialize selectedId from the first entity
const firstId = computed<string | null>(() => entities.value[0]?.id ?? null)
if (firstId.value && !selectedId.value) {
  selectedId.value = firstId.value
}

const selectedEntity = computed<RuntimeEntityViewModel | null>(
  () => entities.value.find((e) => e.id === selectedId.value) ?? null,
)

function selectEntity(id: string): void {
  selectedId.value = id
}

function statLabel(key: string): string {
  return i18n.t(`observatory.runtime.${key}`)
}

function instrumentedValue(value: number): string {
  return testMode || runtimeView.value.worldId ? String(value) : 'Unavailable'
}
</script>

<template>
  <div class="observatory-runtime-viewer">
    <RuntimeEntityList
      :entities="entities"
      :selected-id="selectedId"
      @select="selectEntity"
    />
    <div class="runtime-main">
      <section
        class="runtime-stats"
        aria-labelledby="runtime-stats-title"
      >
        <header class="runtime-stats-header">
          <h2
            id="runtime-stats-title"
            class="runtime-stats-title"
          >
            Runtime Stats
          </h2>
          <span class="runtime-world-id">
            {{ runtimeView.worldId || (testMode ? '' : 'Unavailable') }}
          </span>
        </header>
        <dl class="runtime-stats-grid">
          <RuntimeStatCard
            :label="statLabel('entities')"
            :value="String(runtimeView.entityCount)"
          />
          <RuntimeStatCard
            :label="statLabel('systems')"
            :value="instrumentedValue(runtimeView.systemCount)"
          />
          <RuntimeStatCard
            :label="statLabel('events')"
            :value="instrumentedValue(runtimeView.eventCount)"
          />
          <RuntimeStatCard
            :label="statLabel('fps')"
            :value="instrumentedValue(runtimeView.fps)"
          />
        </dl>
      </section>
      <RuntimeEntityDetails :entity="selectedEntity" />
      <RuntimeEntityInspector :entity-id="selectedId" />
    </div>
  </div>
</template>

<style scoped>
.observatory-runtime-viewer {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  min-width: 0;
  height: 100%;
  border: 1px solid var(--obs-border, #232327);
  border-radius: var(--obs-radius-m, 10px);
  background: var(--obs-surface, #111113);
  overflow: hidden;
}

.runtime-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.runtime-stats {
  display: flex;
  flex-direction: column;
  gap: var(--obs-space-3, 12px);
  padding: var(--obs-space-4, 16px) var(--obs-space-5, 24px);
  border-bottom: 1px solid var(--obs-border, #232327);
  background: var(--obs-bg, #0a0a0b);
}

.runtime-stats-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--obs-space-3, 12px);
}

.runtime-stats-title {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--obs-text-dim, #63636d);
}

.runtime-world-id {
  font-family: var(--obs-font-mono, 'SF Mono', 'Fira Code', Consolas, monospace);
  font-size: 11px;
  color: var(--obs-text-dim, #63636d);
}

.runtime-stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--obs-space-3, 12px);
  margin: 0;
}

.runtime-main :deep(.runtime-entity-details) {
  flex-shrink: 0;
}
</style>
