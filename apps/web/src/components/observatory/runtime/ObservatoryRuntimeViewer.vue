<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from '../../../stores/i18n'
import RuntimeEntityList from './RuntimeEntityList.vue'
import RuntimeEntityDetails, {
  type RuntimeEntity,
} from './RuntimeEntityDetails.vue'
import RuntimeEntityInspector from './RuntimeEntityInspector.vue'
import RuntimeStatCard from './RuntimeStatCard.vue'

/**
 * Local mock runtime state — layout validation only (WO-S6-007).
 * Will be replaced by real runtime state in a future work order.
 */
const MOCK_RUNTIME_STATE = {
  worldId: 'world-001',
  stats: {
    entities: 187,
    systems: 8,
    events: 31,
    fps: 60,
  },
  entities: [
    {
      id: 'guard-001',
      type: 'Guard',
      position: '(10,4)',
      state: 'Patrol',
      health: 100,
    },
    {
      id: 'merchant-001',
      type: 'Merchant',
      position: '(4,8)',
      state: 'Trading',
      health: 100,
    },
    {
      id: 'villager-001',
      type: 'Villager',
      position: '(1,2)',
      state: 'Working',
      health: 100,
    },
  ] as readonly RuntimeEntity[],
}

const i18n = useI18n()
const selectedId = ref<string>(MOCK_RUNTIME_STATE.entities[0].id)
const selectedEntity = computed<RuntimeEntity | null>(
  () =>
    MOCK_RUNTIME_STATE.entities.find((e) => e.id === selectedId.value) ?? null,
)

function selectEntity(id: string): void {
  selectedId.value = id
}

function statLabel(key: string): string {
  return i18n.t(`observatory.runtime.${key}`)
}
</script>

<template>
  <div class="observatory-runtime-viewer">
    <RuntimeEntityList
      :entities="MOCK_RUNTIME_STATE.entities"
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
            {{ MOCK_RUNTIME_STATE.worldId }}
          </span>
        </header>
        <dl class="runtime-stats-grid">
          <RuntimeStatCard
            :label="statLabel('entities')"
            :value="String(MOCK_RUNTIME_STATE.stats.entities)"
          />
          <RuntimeStatCard
            :label="statLabel('systems')"
            :value="String(MOCK_RUNTIME_STATE.stats.systems)"
          />
          <RuntimeStatCard
            :label="statLabel('events')"
            :value="String(MOCK_RUNTIME_STATE.stats.events)"
          />
          <RuntimeStatCard
            :label="statLabel('fps')"
            :value="String(MOCK_RUNTIME_STATE.stats.fps)"
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