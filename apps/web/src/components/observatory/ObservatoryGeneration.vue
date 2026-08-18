<script setup lang="ts">
import { computed } from 'vue'
import { useObservatoryDataStore } from '../../stores/observatoryData'
import { useGameStore } from '../../stores/gameStore'
import { assetArtworkLabel } from '../../assets/GeneratedAssetOrchestrator'

const data = useObservatoryDataStore()
const game = useGameStore()
const imageGenerations = computed(() => Object.values(game.visualGenerationOperations))
const labels: Record<string, string> = {
  REQUEST: 'Request', PROMPT_ASSEMBLY: 'Prompt Assembly', MODEL_GENERATION: 'Model Generation',
  CANDIDATE_PARSE: 'Candidate Parse', VALIDATION: 'Validation', DESIGN_SPECIFICATION: 'Design Specification',
  WORLD_COMPILATION: 'World Compilation', RUNTIME_INJECTION: 'Runtime Injection',
}
</script>

<template>
  <main class="generation-panel">
    <div v-if="data.generationTrace === null" class="generation-empty">
      <p class="generation-empty-title">No generation trace available.</p>
      <p class="generation-empty-copy">Run a world generation command to inspect its pipeline here.</p>
    </div>
    <template v-else>
      <header class="generation-header">
        <div>
          <p class="generation-kicker">Generation Trace</p>
          <h2>Generation</h2>
        </div>
        <code class="generation-id">{{ data.generationTrace.id }}</code>
      </header>

      <section class="generation-card visual-generation-card" aria-labelledby="visual-generation-title">
        <header class="card-heading">
          <h3 id="visual-generation-title">Image Generation</h3>
          <span class="card-count">{{ imageGenerations.filter(operation => operation.stage === 'ready').length }} / {{ imageGenerations.length }} ready</span>
        </header>
        <p v-if="imageGenerations.length === 0" class="card-copy">No visual asset operations.</p>
        <template v-else>
          <div v-for="imageGeneration in imageGenerations" :key="imageGeneration.operationId" class="visual-operation">
          <dl class="detail-list">
            <div><dt>Asset</dt><dd>{{ assetArtworkLabel(imageGeneration) }}</dd></div>
            <div><dt>Asset ID</dt><dd>{{ imageGeneration.assetId }}</dd></div>
            <div v-if="imageGeneration.entityId"><dt>Entity</dt><dd>{{ imageGeneration.entityId }}</dd></div>
            <div><dt>Provider</dt><dd>{{ imageGeneration.provider ?? 'server-selected' }}</dd></div>
            <div v-if="imageGeneration.model"><dt>Model</dt><dd>{{ imageGeneration.model }}</dd></div>
            <div><dt>Mode</dt><dd>{{ imageGeneration.mode }}</dd></div>
            <div><dt>Generation</dt><dd>{{ imageGeneration.status }}</dd></div>
            <div><dt>Artifact</dt><dd>{{ imageGeneration.artifactStatus ?? 'pending' }}</dd></div>
            <div><dt>Manifest</dt><dd>{{ imageGeneration.manifestStatus ?? 'pending' }}</dd></div>
            <div><dt>Asset resolution</dt><dd>{{ imageGeneration.assetResolutionStatus ?? 'pending' }}</dd></div>
            <div><dt>Renderer</dt><dd>{{ imageGeneration.rendererStatus ?? 'pending' }}</dd></div>
            <div><dt>Fallback</dt><dd>{{ imageGeneration.fallback ?? 'no' }}</dd></div>
          </dl>
          <img
            v-if="imageGeneration.stage === 'ready' && imageGeneration.output?.resource?.uri && !imageGeneration.output.resource.uri.startsWith('data:')"
            class="visual-generation-preview"
            :src="imageGeneration.output.resource.uri"
            :alt="`${assetArtworkLabel(imageGeneration)} preview`"
          >
          <p v-if="imageGeneration.failure" class="fallback-note"><span>Fallback</span>{{ imageGeneration.failure.message }}</p>
          </div>
        </template>
      </section>

      <div class="generation-layout">
        <aside class="generation-summary" aria-label="Generation summary">
          <dl class="summary-grid">
            <div class="summary-card">
              <dt>Source</dt>
              <dd :class="`value-${data.generationTrace.source}`">{{ data.generationTrace.source }}</dd>
            </div>
            <div v-if="data.generationTrace.provider" class="summary-card">
              <dt>Provider</dt>
              <dd>{{ data.generationTrace.provider }}</dd>
            </div>
            <div v-if="data.generationTrace.model" class="summary-card">
              <dt>Model</dt>
              <dd>{{ data.generationTrace.model }}</dd>
            </div>
            <div class="summary-card">
              <dt>Status</dt>
              <dd :class="`value-${data.generationTrace.status}`">{{ data.generationTrace.status }}</dd>
            </div>
            <div v-if="data.generationTrace.world" class="summary-card">
              <dt>Runtime entities</dt>
              <dd>{{ data.generationTrace.world.entityCount }}</dd>
            </div>
          </dl>

          <section v-if="data.generationTrace.candidate" class="generation-card">
            <header class="card-heading">
              <h3>Candidate</h3>
              <span class="card-count">{{ data.generationTrace.candidate.entities.length }} entities</span>
            </header>
            <dl class="detail-list">
              <div><dt>Title</dt><dd>{{ data.generationTrace.candidate.title ?? '—' }}</dd></div>
              <div><dt>Genre</dt><dd>{{ data.generationTrace.candidate.genre ?? '—' }}</dd></div>
              <div><dt>Difficulty</dt><dd>{{ data.generationTrace.candidate.difficulty ?? '—' }}</dd></div>
            </dl>
          </section>

          <section v-if="data.generationTrace.specification" class="generation-card">
            <header class="card-heading">
              <h3>Specification</h3>
            </header>
            <p class="card-copy">{{ data.generationTrace.specification.title ?? 'Untitled world' }}</p>
            <p class="card-meta">{{ data.generationTrace.specification.genre ?? '—' }} · {{ data.generationTrace.specification.theme ?? '—' }}</p>
          </section>
        </aside>

        <section class="generation-stages" aria-labelledby="generation-stages-title">
          <header class="stages-header">
            <h3 id="generation-stages-title">Pipeline stages</h3>
            <span>{{ data.generationTrace.stages.length }} steps</span>
          </header>
          <ol class="stages">
            <li v-for="(stage, index) in data.generationTrace.stages" :key="stage.name" class="stage-row">
              <span class="stage-index">{{ String(index + 1).padStart(2, '0') }}</span>
              <span class="stage-marker" :class="`stage-${stage.status}`" aria-hidden="true">
                {{ stage.status === 'success' ? '✓' : stage.status === 'failed' ? '!' : '·' }}
              </span>
              <strong>{{ labels[stage.name] ?? stage.name }}</strong>
              <small :class="`stage-status-${stage.status}`">{{ stage.status }}</small>
              <em v-if="stage.error">{{ stage.error }}</em>
            </li>
          </ol>
          <p v-if="data.generationTrace.fallbackReason" class="fallback-note">
            <span>Fallback</span>{{ data.generationTrace.fallbackReason }}
          </p>
        </section>
      </div>
    </template>
  </main>
</template>

<style scoped>
.generation-panel { min-width: 0; min-height: 100%; border: 1px solid var(--obs-border, #232327); border-radius: var(--obs-radius-m, 10px); background: var(--obs-surface, #111113); overflow: hidden; }
.generation-header { display: flex; align-items: center; justify-content: space-between; gap: var(--obs-space-3); padding: var(--obs-space-5) var(--obs-space-5) var(--obs-space-4); border-bottom: 1px solid var(--obs-border); background: var(--obs-bg); }
.generation-kicker, .stages-header h3, .card-heading h3 { margin: 0; color: var(--obs-text-dim); font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; }
h2 { margin: var(--obs-space-1) 0 0; color: var(--obs-text); font-size: 18px; letter-spacing: -0.02em; }
.generation-id { color: var(--obs-text-dim); font-family: var(--obs-font-mono); font-size: 11px; }
.generation-layout { display: grid; grid-template-columns: 300px minmax(0, 1fr); min-width: 0; }
.generation-summary { display: flex; flex-direction: column; gap: var(--obs-space-4); padding: var(--obs-space-4); border-right: 1px solid var(--obs-border); background: var(--obs-bg); }
.summary-grid { display: grid; gap: var(--obs-space-2); margin: 0; }
.summary-card, .generation-card { display: flex; flex-direction: column; gap: var(--obs-space-1); padding: var(--obs-space-3); border: 1px solid var(--obs-border); border-radius: var(--obs-radius-s, 6px); background: var(--obs-surface); }
.summary-card dt, .detail-list dt { color: var(--obs-text-dim); font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
.summary-card dd, .detail-list dd { margin: 0; color: var(--obs-text); font-family: var(--obs-font-mono); font-size: 14px; }
.summary-card dd { font-size: 18px; font-weight: 600; }
.value-ai, .value-success { color: var(--obs-success) !important; } .value-deterministic, .value-fallback { color: var(--obs-warning, #f2b84b) !important; } .value-failed { color: var(--obs-danger, #f87171) !important; }
.generation-card { gap: var(--obs-space-3); }
.visual-generation-card { margin: var(--obs-space-4); }
.visual-generation-preview { display: block; width: 96px; height: 96px; object-fit: contain; border: 1px solid var(--obs-border); border-radius: var(--obs-radius-s, 6px); background: var(--obs-bg); }
.card-heading, .stages-header { display: flex; align-items: center; justify-content: space-between; gap: var(--obs-space-2); }
.card-count, .stages-header > span, .card-meta { color: var(--obs-text-dim); font-family: var(--obs-font-mono); font-size: 11px; }
.detail-list { display: grid; gap: var(--obs-space-2); margin: 0; }
.detail-list div { display: flex; justify-content: space-between; gap: var(--obs-space-2); }
.detail-list dd { font-size: 12px; text-align: right; }
.card-copy, .card-meta { margin: 0; } .card-copy { color: var(--obs-text); font-size: 13px; } .card-meta { color: var(--obs-text-dim); }
.generation-stages { min-width: 0; padding: var(--obs-space-5); background: var(--obs-surface); }
.stages { display: grid; gap: 0; margin: var(--obs-space-4) 0 0; padding: 0; border: 1px solid var(--obs-border); border-radius: var(--obs-radius-s, 6px); list-style: none; overflow: hidden; }
.stage-row { display: grid; grid-template-columns: 28px 22px minmax(0, 1fr) auto; gap: var(--obs-space-2); align-items: center; min-height: 44px; padding: var(--obs-space-2) var(--obs-space-3); border-bottom: 1px solid var(--obs-border); }
.stage-row:last-child { border-bottom: 0; }
.stage-index { color: var(--obs-text-dim); font-family: var(--obs-font-mono); font-size: 10px; }
.stage-marker { display: grid; width: 18px; height: 18px; place-items: center; border: 1px solid var(--obs-border-strong); border-radius: 50%; color: var(--obs-text-dim); font-family: var(--obs-font-mono); font-size: 11px; }
.stage-success { border-color: rgba(74, 222, 128, 0.4); color: var(--obs-success); background: rgba(74, 222, 128, 0.08); }
.stage-failed { border-color: rgba(248, 113, 113, 0.4); color: #f87171; background: rgba(248, 113, 113, 0.08); }
.stage-row strong { min-width: 0; color: var(--obs-text); font-size: 12px; font-weight: 500; }
.stage-row small { color: var(--obs-text-dim); font-family: var(--obs-font-mono); font-size: 10px; text-transform: uppercase; }
.stage-status-success { color: var(--obs-success) !important; } .stage-status-failed { color: #f87171 !important; }
.stage-row em { grid-column: 3 / -1; color: #f87171; font-size: 11px; font-style: normal; overflow-wrap: anywhere; }
.fallback-note { display: flex; gap: var(--obs-space-2); margin: var(--obs-space-4) 0 0; padding: var(--obs-space-3); border: 1px solid rgba(242, 184, 75, 0.25); border-radius: var(--obs-radius-s, 6px); color: var(--obs-text-dim); font-size: 12px; overflow-wrap: anywhere; }
.fallback-note span { color: var(--obs-warning, #f2b84b); font-family: var(--obs-font-mono); font-size: 10px; font-weight: 600; text-transform: uppercase; }
.generation-empty { padding: var(--obs-space-6); border: 1px dashed var(--obs-border-strong); border-radius: var(--obs-radius-m); background: var(--obs-surface); }
.generation-empty-title, .generation-empty-copy { margin: 0; } .generation-empty-title { color: var(--obs-text); font-size: 13px; } .generation-empty-copy { margin-top: var(--obs-space-1); color: var(--obs-text-dim); font-size: 12px; }
@media (max-width: 820px) { .generation-layout { grid-template-columns: 1fr; } .generation-summary { border-right: 0; border-bottom: 1px solid var(--obs-border); } }
@media (max-width: 520px) { .generation-header { align-items: flex-start; flex-direction: column; } .generation-stages { padding: var(--obs-space-4); } .stage-row { grid-template-columns: 24px 20px minmax(0, 1fr); } .stage-row small { grid-column: 3; } .stage-row em { grid-column: 3; } }
</style>
