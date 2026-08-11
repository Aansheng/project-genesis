<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '../../../stores/i18n'
import { useObservatoryDataStore } from '../../../stores/observatoryData'
import RuntimeComponentCard from './RuntimeComponentCard.vue'

const props = defineProps<{
  entityId: string | null
}>()

const dataStore = useObservatoryDataStore()
const i18n = useI18n()

const entity = computed(() => {
  if (!props.entityId) return null
  return (
    dataStore.viewModel.runtimeView.entities.find(
      (e) => e.id === props.entityId,
    ) ?? null
  )
})

const componentCount = computed(() => entity.value?.components.length ?? 0)
</script>

<template>
  <section
    v-if="entity"
    class="runtime-entity-inspector"
    aria-label="Entity inspector"
  >
    <header class="runtime-inspector-header">
      <h3 class="runtime-inspector-title">
        {{ i18n.t('observatory.runtime.inspector') }}
      </h3>
      <span class="runtime-inspector-count">
        {{ i18n.t('observatory.runtime.componentCount') }}: {{ componentCount }}
      </span>
    </header>
    <div class="runtime-inspector-list">
      <RuntimeComponentCard
        v-for="(component, index) in entity.components"
        :key="`${entity.id}-component-${index}`"
        :component="component"
      />
    </div>
  </section>
</template>

<style scoped>
.runtime-entity-inspector {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  flex: 1;
  padding: var(--obs-space-4, 16px) var(--obs-space-5, 24px);
  border-top: 1px solid var(--obs-border, #232327);
  background: var(--obs-bg, #0a0a0b);
  overflow-y: auto;
}

.runtime-inspector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--obs-space-3, 12px);
  margin-bottom: var(--obs-space-3, 12px);
}

.runtime-inspector-title {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--obs-text-dim, #63636d);
}

.runtime-inspector-count {
  font-family: var(--obs-font-mono, 'SF Mono', 'Fira Code', Consolas, monospace);
  font-size: 11px;
  color: var(--obs-text-dim, #63636d);
}

.runtime-inspector-list {
  display: flex;
  flex-direction: column;
  gap: var(--obs-space-2, 8px);
  min-height: 0;
}
</style>