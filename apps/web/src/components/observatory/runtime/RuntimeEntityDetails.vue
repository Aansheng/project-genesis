<script lang="ts">
export type { RuntimeEntityViewModel as RuntimeEntity } from '../../../adapters/observatory'
</script>

<script setup lang="ts">
import { useI18n } from '../../../stores/i18n'
import type { RuntimeEntityViewModel as RuntimeEntity } from '../../../adapters/observatory'

defineProps<{
  entity: RuntimeEntity | null
}>()

const i18n = useI18n()
</script>

<template>
  <article
    class="runtime-entity-details"
    aria-label="Runtime entity details"
  >
    <template v-if="entity">
      <header class="runtime-entity-header">
        <h2 class="runtime-entity-title">
          Runtime Entity Details
        </h2>
        <dl class="runtime-entity-meta">
          <div class="runtime-entity-meta-item">
            <dt class="runtime-entity-meta-label">
              ID
            </dt>
            <dd class="runtime-entity-meta-value">
              {{ entity.id }}
            </dd>
          </div>
          <div class="runtime-entity-meta-item">
            <dt class="runtime-entity-meta-label">
              Type
            </dt>
            <dd class="runtime-entity-meta-value">
              {{ entity.type }}
            </dd>
          </div>
        </dl>
      </header>

      <dl class="runtime-entity-grid">
        <div class="runtime-entity-grid-item">
          <dt class="runtime-entity-grid-label">
            {{ i18n.t('observatory.runtime.position') }}
          </dt>
          <dd class="runtime-entity-grid-value">
            {{ entity.position }}
          </dd>
        </div>
        <div class="runtime-entity-grid-item">
          <dt class="runtime-entity-grid-label">
            {{ i18n.t('observatory.runtime.health') }}
          </dt>
          <dd class="runtime-entity-grid-value">
            {{ entity.health }}
          </dd>
        </div>
        <div class="runtime-entity-grid-item">
          <dt class="runtime-entity-grid-label">
            {{ i18n.t('observatory.runtime.state') }}
          </dt>
          <dd class="runtime-entity-grid-value">
            {{ entity.state }}
          </dd>
        </div>
      </dl>
    </template>

    <p
      v-else
      class="runtime-entity-empty"
    >
      No entity selected
    </p>
  </article>
</template>

<style scoped>
.runtime-entity-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: var(--obs-bg, #0a0a0b);
  overflow-y: auto;
}

.runtime-entity-header {
  padding: var(--obs-space-5, 24px) var(--obs-space-5, 24px) var(--obs-space-4, 16px);
  border-bottom: 1px solid var(--obs-border, #232327);
}

.runtime-entity-title {
  margin: 0 0 var(--obs-space-3, 12px);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--obs-text-dim, #63636d);
}

.runtime-entity-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--obs-space-3, 12px) var(--obs-space-6, 32px);
  margin: 0;
}

.runtime-entity-meta-item {
  display: flex;
  flex-direction: column;
  gap: var(--obs-space-1, 4px);
}

.runtime-entity-meta-label {
  font-size: 12px;
  color: var(--obs-text-dim, #63636d);
}

.runtime-entity-meta-value {
  margin: 0;
  font-family: var(--obs-font-mono, 'SF Mono', 'Fira Code', Consolas, monospace);
  font-size: 14px;
  font-weight: 500;
  color: var(--obs-text, #f5f5f4);
}

.runtime-entity-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--obs-space-3, 12px);
  margin: 0;
  padding: var(--obs-space-4, 16px) var(--obs-space-5, 24px);
}

.runtime-entity-grid-item {
  display: flex;
  flex-direction: column;
  gap: var(--obs-space-1, 4px);
  padding: var(--obs-space-3, 12px);
  border: 1px solid var(--obs-border, #232327);
  border-radius: var(--obs-radius-s, 6px);
  background: var(--obs-surface, #111113);
}

.runtime-entity-grid-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--obs-text-dim, #63636d);
}

.runtime-entity-grid-value {
  margin: 0;
  font-family: var(--obs-font-mono, 'SF Mono', 'Fira Code', Consolas, monospace);
  font-size: 14px;
  font-weight: 500;
  color: var(--obs-text, #f5f5f4);
}

.runtime-entity-empty {
  margin: 0;
  padding: var(--obs-space-5, 24px);
  color: var(--obs-text-dim, #63636d);
  font-size: 13px;
}
</style>