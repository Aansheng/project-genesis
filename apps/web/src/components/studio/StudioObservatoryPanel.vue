<script setup lang="ts">
import { computed } from 'vue'
import { useObservatoryDataStore } from '../../stores/observatoryData'
import { useGameStore } from '../../stores/gameStore'
import { assetArtworkLabel } from '../../assets/GeneratedAssetOrchestrator'

const observatoryData = useObservatoryDataStore()
const runtime = computed(() => observatoryData.viewModel.runtimeView)
const generation = computed(() => observatoryData.generationTrace)
const gameStore = useGameStore()
const imageGenerations = computed(() => Object.values(gameStore.visualGenerationOperations))
</script>

<template>
  <div class="studio-observatory-panel">
    <section class="generation-summary">
      <div class="section-heading"><h3>Generation</h3><span v-if="generation">{{ generation.source }} · {{ generation.status }}</span></div>
      <p v-if="generation === null">No generation trace available</p>
      <template v-else>
        <p>Validation: {{ generation.validation?.status ?? (generation.status === 'success' ? 'passed' : 'fallback') }}</p>
        <p v-if="generation.specification">Design: {{ generation.specification.genre }} · {{ generation.specification.theme ?? '—' }} · {{ generation.specification.difficulty ?? '—' }}</p>
        <p v-if="generation.world">Entities: {{ generation.world.entityCount }}</p>
      </template>
    </section>
    <section class="generation-summary" aria-labelledby="image-generation-title">
      <div class="section-heading">
        <h3 id="image-generation-title">Image Generation</h3>
        <span v-if="imageGenerations.length">{{ imageGenerations.filter(operation => operation.stage === 'ready').length }} / {{ imageGenerations.length }} ready</span>
      </div>
      <p v-if="imageGenerations.length === 0">No visual generation operations</p>
      <ul v-else class="visual-operation-list">
        <li v-for="operation in imageGenerations" :key="operation.operationId">
          <span>{{ assetArtworkLabel(operation) }}</span>
          <strong>{{ operation.stage ?? operation.status }}</strong>
        </li>
      </ul>
    </section>
    <div
      v-if="runtime.entityCount === 0"
      class="empty-state"
    >
      <p>No runtime world available</p>
      <span>Runtime details will appear after world generation.</span>
    </div>

    <div
      v-else
      class="observatory-content"
    >
      <section aria-labelledby="studio-runtime-title">
        <div class="section-heading">
          <h3 id="studio-runtime-title">
            Runtime
          </h3>
          <span class="live-status"><i aria-hidden="true" /> Live</span>
        </div>
        <dl class="runtime-summary">
          <div>
            <dt>World</dt>
            <dd>{{ runtime.worldId }}</dd>
          </div>
          <div>
            <dt>Entities</dt>
            <dd>{{ runtime.entityCount }}</dd>
          </div>
        </dl>
        <ul class="runtime-entities">
          <li
            v-for="entity in runtime.entities"
            :key="entity.id"
          >
            <span>{{ entity.id }}</span>
            <span>{{ entity.type }}</span>
          </li>
        </ul>
      </section>

      <section
        class="unavailable-sections"
        aria-labelledby="studio-observability-title"
      >
        <h3 id="studio-observability-title">
          Observability
        </h3>
        <p>Trace <span>No trace data available</span></p>
        <p>Timeline <span>No timeline data available</span></p>
        <p>History <span>No history data available</span></p>
        <p>Diff <span>No diff data available</span></p>
        <p>Event Stream <span>No event stream data available</span></p>
      </section>

      <RouterLink
        class="full-observatory-link"
        to="/observatory"
      >
        Open Full Observatory <span aria-hidden="true">↗</span>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.studio-observatory-panel {
  min-height: 0;
}

.generation-summary {
  display: flex;
  flex-direction: column;
  gap: var(--studio-space-3);
  padding: var(--studio-space-4);
  border-bottom: 1px solid var(--studio-border);
}

.generation-summary p {
  margin: 0;
  color: var(--studio-text-dim);
  font-size: 11px;
  line-height: 1.5;
}

.generation-summary p + p {
  padding-top: var(--studio-space-2);
  border-top: 1px solid var(--studio-border);
}

.empty-state {
  display: flex;
  flex-direction: column;
  gap: var(--studio-space-2);
  padding: var(--studio-space-5);
  color: var(--studio-text-muted);
}

.empty-state p {
  color: var(--studio-text);
  font-weight: 600;
}

.empty-state span,
.unavailable-sections span {
  color: var(--studio-text-dim);
  font-size: 11px;
}

.observatory-content {
  display: flex;
  flex-direction: column;
  gap: var(--studio-space-5);
  padding: var(--studio-space-4);
  overflow-y: auto;
}

.observatory-content section {
  display: flex;
  flex-direction: column;
  gap: var(--studio-space-3);
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

h3 {
  color: var(--studio-text-muted);
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.live-status {
  display: inline-flex;
  align-items: center;
  gap: var(--studio-space-1);
  color: var(--studio-success);
  font-size: 10px;
}

.live-status i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.runtime-summary {
  display: grid;
  gap: var(--studio-space-2);
  margin: 0;
}

.runtime-summary div,
.runtime-entities li,
.unavailable-sections p {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--studio-space-2);
  padding: var(--studio-space-2) 0;
  border-bottom: 1px solid var(--studio-border);
}

dt,
.unavailable-sections p {
  color: var(--studio-text-dim);
  font-size: 11px;
}

dd,
.runtime-entities span:first-child {
  margin: 0;
  color: var(--studio-text);
  font-family: var(--studio-font-mono);
  font-size: 12px;
}

.runtime-entities {
  margin: 0;
  padding: 0;
  list-style: none;
}

.runtime-entities span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.runtime-entities span:last-child {
  color: var(--studio-text-dim);
  font-size: 11px;
}

.unavailable-sections p {
  margin: 0;
}

.full-observatory-link {
  color: var(--studio-accent-strong);
  font-size: 11px;
  text-decoration: none;
}

.full-observatory-link:hover,
.full-observatory-link:focus-visible {
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
