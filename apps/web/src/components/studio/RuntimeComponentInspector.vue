<script setup lang="ts">
import { computed } from 'vue'
import type { RuntimeComponent } from '@genesis/shared'

interface PropertyRow {
  readonly key: string
  readonly value: string
  readonly depth: number
}

const MAX_DEPTH = 4

const props = defineProps<{
  component: RuntimeComponent
}>()

function scalarValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return String(value)
}

function collectRows(
  value: unknown,
  key: string,
  depth: number,
  rows: PropertyRow[],
): void {
  if (value === null || value === undefined || typeof value !== 'object') {
    rows.push({ key, value: scalarValue(value), depth })
    return
  }

  if (depth >= MAX_DEPTH) {
    rows.push({
      key,
      value: Array.isArray(value) ? `[${value.length} items]` : '[Object]',
      depth,
    })
    return
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      rows.push({ key, value: '[]', depth })
      return
    }

    if (value.every((item) => item === null || item === undefined || typeof item !== 'object')) {
      rows.push({
        key,
        value: `[${value.map(scalarValue).join(', ')}]`,
        depth,
      })
      return
    }

    value.forEach((item, index) => collectRows(item, `${key}[${index}]`, depth + 1, rows))
    return
  }

  const entries = Object.entries(value)
  if (entries.length === 0) {
    rows.push({ key, value: '{}', depth })
    return
  }

  entries.forEach(([childKey, childValue]) => {
    collectRows(childValue, key ? `${key}.${childKey}` : childKey, depth + 1, rows)
  })
}

const rows = computed<readonly PropertyRow[]>(() => {
  const nextRows: PropertyRow[] = []
  Object.entries(props.component.properties ?? {}).forEach(([key, value]) => {
    collectRows(value, key, 0, nextRows)
  })
  return nextRows
})
</script>

<template>
  <article class="runtime-component-inspector">
    <h4>{{ component.type }}</h4>
    <dl v-if="rows.length" class="component-properties">
      <div
        v-for="row in rows"
        :key="`${row.depth}:${row.key}`"
        class="component-property"
        :style="{
          '--property-depth': row.depth,
        }"
      >
        <dt>{{ row.key }}</dt>
        <dd>{{ row.value }}</dd>
      </div>
    </dl>
    <span
      v-else
      class="component-empty"
    >No properties</span>
  </article>
</template>

<style scoped>
.runtime-component-inspector {
  padding: var(--studio-space-3) 0;
  border-top: 1px solid var(--studio-border);
}

h4 {
  margin: 0;
  color: var(--studio-text);
  font-family: var(--studio-font-mono);
  font-size: 12px;
  font-weight: 500;
}

.component-properties {
  display: grid;
  gap: var(--studio-space-1);
  margin: var(--studio-space-2) 0 0;
}

.component-property {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, auto);
  gap: var(--studio-space-2);
  padding-left: calc(var(--property-depth) * var(--studio-space-3));
}

dt {
  overflow: hidden;
  color: var(--studio-text-dim);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

dd {
  max-width: 180px;
  margin: 0;
  overflow: hidden;
  color: var(--studio-text);
  font-family: var(--studio-font-mono);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.component-empty {
  display: block;
  margin-top: var(--studio-space-2);
  color: var(--studio-text-dim);
  font-size: 11px;
}
</style>
