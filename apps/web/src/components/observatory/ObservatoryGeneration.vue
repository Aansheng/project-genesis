<script setup lang="ts">
import { useObservatoryDataStore } from '../../stores/observatoryData'

const data = useObservatoryDataStore()
const labels: Record<string, string> = {
  REQUEST: 'Request', PROMPT_ASSEMBLY: 'Prompt Assembly', MODEL_GENERATION: 'Model Generation',
  CANDIDATE_PARSE: 'Candidate Parse', VALIDATION: 'Validation', DESIGN_SPECIFICATION: 'Design Specification',
  WORLD_COMPILATION: 'World Compilation', RUNTIME_INJECTION: 'Runtime Injection',
}
</script>

<template>
  <main class="generation-panel">
    <h2>Generation</h2>
    <p v-if="data.generationTrace === null">No generation trace available.</p>
    <template v-else>
      <dl class="summary">
        <div><dt>Source</dt><dd>{{ data.generationTrace.source }}</dd></div>
        <div><dt>Status</dt><dd>{{ data.generationTrace.status }}</dd></div>
        <div v-if="data.generationTrace.world"><dt>Runtime entities</dt><dd>{{ data.generationTrace.world.entityCount }}</dd></div>
      </dl>
      <ol class="stages">
        <li v-for="stage in data.generationTrace.stages" :key="stage.name">
          <span>{{ stage.status === 'success' ? '✓' : stage.status === 'failed' ? '✕' : '·' }}</span>
          <strong>{{ labels[stage.name] ?? stage.name }}</strong>
          <small>{{ stage.status }}</small>
          <em v-if="stage.error">{{ stage.error }}</em>
        </li>
      </ol>
      <section v-if="data.generationTrace.candidate">
        <h3>Candidate</h3>
        <p>{{ data.generationTrace.candidate.title }} · {{ data.generationTrace.candidate.genre }} · {{ data.generationTrace.candidate.difficulty ?? '—' }}</p>
        <p>Entities: {{ data.generationTrace.candidate.entities.map(entity => entity.id).join(', ') }}</p>
      </section>
      <section v-if="data.generationTrace.specification">
        <h3>Specification</h3>
        <p>{{ data.generationTrace.specification.title }} · {{ data.generationTrace.specification.genre }} · {{ data.generationTrace.specification.theme ?? '—' }}</p>
      </section>
      <p v-if="data.generationTrace.fallbackReason">Fallback: {{ data.generationTrace.fallbackReason }}</p>
    </template>
  </main>
</template>

<style scoped>
.generation-panel { display: flex; flex-direction: column; gap: var(--obs-space-4); }
h2, h3 { margin: 0; }
h2 { font-size: 18px; } h3 { font-size: 13px; }
p { margin: 0; color: var(--obs-text-muted); }
.summary { display: flex; gap: var(--obs-space-5); margin: 0; }
.summary div { display: grid; gap: var(--obs-space-1); }
dt, small { color: var(--obs-text-dim); font-size: 11px; }
dd { margin: 0; font-family: var(--obs-font-mono); }
.stages { display: grid; gap: var(--obs-space-2); margin: 0; padding: var(--obs-space-4); border: 1px solid var(--obs-border); border-radius: var(--obs-radius-m); list-style: none; background: var(--obs-surface); }
.stages li { display: grid; grid-template-columns: 18px 1fr auto; gap: var(--obs-space-2); align-items: center; }
.stages li > span { color: var(--obs-success); } .stages small { font-family: var(--obs-font-mono); }
.stages em { grid-column: 2 / -1; color: #f87171; font-size: 11px; font-style: normal; }
section { display: grid; gap: var(--obs-space-2); padding: var(--obs-space-4); border: 1px solid var(--obs-border); border-radius: var(--obs-radius-m); background: var(--obs-surface); }
</style>
