<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { isPositionComponent } from '@genesis/shared'
import { ObservatoryRuntimeBinding } from '../../adapters/observatory'
import { useGameStore } from '../../stores/gameStore'
import { useObservatoryDataStore } from '../../stores/observatoryData'
import RuntimeComponentInspector from './RuntimeComponentInspector.vue'
import StudioObservatoryPanel from './StudioObservatoryPanel.vue'

type InspectorMode = 'entity' | 'observatory'

const gameStore = useGameStore()
const observatoryData = useObservatoryDataStore()
const runtimeBinding = new ObservatoryRuntimeBinding(
  gameStore.worldStore,
  observatoryData,
)
const inspectorMode = ref<InspectorMode>('entity')

watch(
  () => gameStore.renderVersion,
  () => runtimeBinding.sync(),
  { immediate: true },
)

const runtime = computed(() => observatoryData.viewModel.runtimeView)
const selectedEntity = computed(() => {
  void gameStore.renderVersion
  return gameStore.selectedEntity
})
const selectedComponents = computed(() => selectedEntity.value?.components ?? [])
const selectedPosition = computed(() =>
  selectedComponents.value.find(isPositionComponent),
)
const orderedComponents = computed(() => {
  const position = selectedPosition.value
  return position === undefined
    ? selectedComponents.value
    : [position, ...selectedComponents.value.filter((component) => component !== position)]
})
</script>

<template>
  <aside
    class="inspector-panel"
    aria-labelledby="inspector-title"
  >
    <header class="panel-header">
      <div>
        <span class="panel-kicker">Runtime</span>
        <h2 id="inspector-title">
          Inspector
        </h2>
      </div>
      <span>Studio</span>
    </header>

    <div
      class="inspector-tabs"
      role="tablist"
      aria-label="Inspector mode"
    >
      <button
        type="button"
        role="tab"
        :aria-selected="inspectorMode === 'entity'"
        :class="{ active: inspectorMode === 'entity' }"
        @click="inspectorMode = 'entity'"
      >
        Entity
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="inspectorMode === 'observatory'"
        :class="{ active: inspectorMode === 'observatory' }"
        @click="inspectorMode = 'observatory'"
      >
        Observatory
      </button>
    </div>

    <StudioObservatoryPanel v-if="inspectorMode === 'observatory'" />

    <div
      v-else-if="runtime.entityCount === 0"
      class="empty-state"
    >
      <p>No runtime world available</p>
      <span>Runtime details will appear after world generation.</span>
    </div>

    <div
      v-else
      class="runtime-inspector"
    >
      <section aria-labelledby="runtime-summary-title">
        <h3 id="runtime-summary-title">
          Runtime
        </h3>
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
        <p
          v-if="selectedEntity === null"
          class="selection-hint"
        >
          Select an entity in World Explorer to inspect its runtime details.
        </p>
      </section>

      <section
        v-if="selectedEntity === null"
        aria-labelledby="runtime-entities-title"
      >
        <h3 id="runtime-entities-title">
          Runtime Entities
        </h3>
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
        v-else
        class="entity-inspector"
        aria-labelledby="entity-inspector-title"
      >
        <div class="entity-inspector-heading">
          <h3 id="entity-inspector-title">
            Entity
          </h3>
          <span class="entity-inspector-id">{{ selectedEntity.id }}</span>
        </div>

        <dl class="entity-summary">
          <div>
            <dt>Type</dt>
            <dd>{{ selectedEntity.type }}</dd>
          </div>
          <div>
            <dt>Components</dt>
            <dd>{{ selectedComponents.length }}</dd>
          </div>
        </dl>

        <section
          v-if="selectedPosition"
          class="position-section"
          aria-labelledby="position-section-title"
        >
          <h3 id="position-section-title">
            Position
          </h3>
          <dl class="position-summary">
            <div>
              <dt>X</dt>
              <dd>{{ selectedPosition.properties.x }}</dd>
            </div>
            <div>
              <dt>Y</dt>
              <dd>{{ selectedPosition.properties.y }}</dd>
            </div>
          </dl>
        </section>

        <div class="component-list">
          <h3>Components</h3>
          <RuntimeComponentInspector
            v-for="(component, index) in orderedComponents"
            :key="`${component.type}-${index}`"
            :component="component"
          />
        </div>
      </section>
    </div>
  </aside>
</template>

<style scoped>
.inspector-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  border-left: 1px solid var(--studio-border);
  background: var(--studio-surface);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 52px;
  padding: 0 var(--studio-space-4);
  border-bottom: 1px solid var(--studio-border);
}

h2,
h3 {
  font-size: 11px;
  font-weight: 650;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

h2 { font-size: 12px; }

.panel-kicker {
  display: block;
  color: var(--studio-text-dim);
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.panel-header a {
  color: var(--studio-accent-strong);
  font-size: 11px;
  text-decoration: none;
}

.panel-header a:hover,
.panel-header a:focus-visible {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.panel-header > span {
  color: var(--studio-text-dim);
  font-size: 10px;
}

.inspector-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--studio-space-1);
  margin: var(--studio-space-3) var(--studio-space-4) 0;
  padding: 3px;
  border: 1px solid var(--studio-border);
  border-radius: var(--studio-radius-sm);
  background: var(--studio-bg);
}

.inspector-tabs button {
  min-height: 28px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: var(--studio-text-dim);
  cursor: pointer;
  font: inherit;
  font-size: 11px;
}

.inspector-tabs button.active {
  background: var(--studio-surface-hover);
  color: var(--studio-text);
}

.empty-state {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  gap: var(--studio-space-2);
  padding: var(--studio-space-5);
  color: var(--studio-text-muted);
}

.empty-state p {
  color: var(--studio-text);
  font-weight: 600;
}

.empty-state span {
  font-size: 12px;
  line-height: 1.6;
}

.runtime-inspector {
  display: flex;
  flex-direction: column;
  gap: var(--studio-space-5);
  padding: var(--studio-space-4);
  overflow-y: auto;
}

.runtime-inspector section {
  display: flex;
  flex-direction: column;
  gap: var(--studio-space-3);
}

h3 {
  color: var(--studio-text-muted);
}

.runtime-summary {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--studio-space-2);
  margin: 0;
}

.runtime-summary div {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: baseline;
  padding: var(--studio-space-2) 0;
  border-bottom: 1px solid var(--studio-border);
}

dt {
  color: var(--studio-text-dim);
  font-size: 11px;
}

dd {
  margin: 0;
  color: var(--studio-text);
  font-family: var(--studio-font-mono);
  font-size: 13px;
}

.runtime-entities {
  margin: 0;
  padding: 0;
  list-style: none;
}

.runtime-entities li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--studio-space-2);
  min-height: 32px;
  border-bottom: 1px solid var(--studio-border);
  font-size: 12px;
}

.runtime-entities li span:first-child {
  overflow: hidden;
  font-family: var(--studio-font-mono);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.runtime-entities li span:last-child {
  color: var(--studio-text-dim);
}

.selection-hint {
  margin: var(--studio-space-3) 0 0;
  color: var(--studio-text-dim);
  font-size: 11px;
  line-height: 1.5;
}

.entity-inspector {
  display: flex;
  flex-direction: column;
  gap: var(--studio-space-4);
}

.entity-inspector-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--studio-space-2);
}

.entity-inspector-id {
  color: var(--studio-accent-strong);
  font-family: var(--studio-font-mono);
  font-size: 11px;
}

.entity-summary {
  margin: 0;
}

.entity-summary div {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: baseline;
  padding: var(--studio-space-2) 0;
  border-bottom: 1px solid var(--studio-border);
}

.component-list {
  display: flex;
  flex-direction: column;
  gap: var(--studio-space-2);
}

.component-list h3 {
  margin-bottom: var(--studio-space-1);
}

.position-section {
  display: flex;
  flex-direction: column;
  gap: var(--studio-space-2);
  padding-top: var(--studio-space-3);
  border-top: 1px solid var(--studio-border);
}

.position-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--studio-space-2);
  margin: 0;
}

.position-summary div {
  display: grid;
  gap: 2px;
  padding: var(--studio-space-2);
  background: var(--studio-surface-raised);
}

.position-summary dd {
  font-size: 14px;
}

</style>
