<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '../../stores/gameStore'
import { useObservatoryDataStore } from '../../stores/observatoryData'
import { PROJECT_METADATA } from '../../projectMetadata'

const gameStore = useGameStore()
const dataStore = useObservatoryDataStore()

const runtime = computed(() => dataStore.viewModel.runtimeView)
const generation = computed(() => dataStore.generationTrace)
const operations = computed(() => Object.values(gameStore.visualGenerationOperations))
const manifestEntries = computed(() => gameStore.assetManifest.entries)
const currentTitle = computed(() => generation.value?.specification?.title ?? generation.value?.candidate?.title)
const currentGenre = computed(() => generation.value?.specification?.genre ?? generation.value?.candidate?.genre)
const gameplay = computed(() => gameStore.gameplaySpecification)
const gameplayRules = computed(() => gameStore.gameplayRuleSet)
const primaryGameplayRule = computed(() => gameplayRules.value?.rules[0] ?? null)
const gameplayCounts = computed(() => {
  const mechanics = gameplay.value?.mechanics ?? []
  return {
    mechanics: mechanics.length,
    supported: mechanics.filter(item => item.supportStatus === 'supported').length,
    deferred: mechanics.filter(item => item.supportStatus === 'deferred').length,
  }
})
const gameplayRuleCounts = computed(() => {
  const rules = gameplayRules.value?.rules ?? []
  return {
    total: rules.length,
    supported: rules.filter(rule => rule.supportStatus === 'supported').length,
    partial: rules.filter(rule => rule.supportStatus === 'partially_supported').length,
    deferred: rules.filter(rule => rule.supportStatus === 'deferred').length,
  }
})
const visualCounts = computed(() => ({
  total: operations.value.length,
  ready: operations.value.filter((item) => item.stage === 'ready').length,
  active: operations.value.filter((item) => item.stage === 'queued' || item.stage === 'generating' || item.stage === 'applying').length,
  fallback: operations.value.filter((item) => item.stage === 'fallback').length,
}))
const assetCounts = computed(() => ({
  total: manifestEntries.value.length,
  generated: manifestEntries.value.filter((item) => item.origin === 'generated').length,
  static: manifestEntries.value.filter((item) => item.origin === 'static').length,
  fallback: manifestEntries.value.filter((item) => item.origin === 'fallback').length,
}))
</script>

<template>
  <div class="observatory-overview">
    <section class="overview-section" aria-labelledby="current-world-title">
      <h2 id="current-world-title" class="overview-section-title">Current World</h2>
      <div v-if="currentTitle || runtime.entityCount > 0" class="fact-grid">
        <article class="fact-card">
          <span class="fact-label">Title</span>
          <strong>{{ currentTitle ?? 'Unavailable' }}</strong>
        </article>
        <article class="fact-card">
          <span class="fact-label">Genre</span>
          <strong>{{ currentGenre ?? 'Unavailable' }}</strong>
        </article>
        <article class="fact-card">
          <span class="fact-label">Runtime entities</span>
          <strong>{{ runtime.entityCount }}</strong>
        </article>
      </div>
      <p v-else class="empty-state">No current world is available in this session.</p>
    </section>

    <section class="overview-section" aria-labelledby="generation-title">
      <h2 id="generation-title" class="overview-section-title">Game Generation</h2>
      <dl v-if="generation" class="fact-list">
        <div><dt>Source</dt><dd>{{ generation.source }}</dd></div>
        <div><dt>Outcome</dt><dd>{{ generation.status }}</dd></div>
        <div v-if="generation.provider"><dt>Provider</dt><dd>{{ generation.provider }}</dd></div>
        <div v-if="generation.model"><dt>Model</dt><dd>{{ generation.model }}</dd></div>
      </dl>
      <p v-else class="empty-state">No game generation has been recorded for this session.</p>
    </section>

    <section class="overview-section" aria-labelledby="gameplay-title">
      <h2 id="gameplay-title" class="overview-section-title">Gameplay Specification</h2>
      <div v-if="gameplay" class="fact-grid">
        <article class="fact-card"><span class="fact-label">Revision</span><strong>{{ gameplay.gameplayRevision }}</strong></article>
        <article class="fact-card"><span class="fact-label">Mechanics</span><strong>{{ gameplayCounts.mechanics }}</strong></article>
        <article class="fact-card"><span class="fact-label">Supported / Deferred</span><strong>{{ gameplayCounts.supported }} / {{ gameplayCounts.deferred }}</strong></article>
        <article class="fact-card"><span class="fact-label">Primary objective</span><strong>{{ gameplay.gameLoop.objective }}</strong></article>
      </div>
      <p v-else class="empty-state">No gameplay specification is available for this session.</p>
    </section>

    <section class="overview-section" aria-labelledby="gameplay-rules-title">
      <h2 id="gameplay-rules-title" class="overview-section-title">Gameplay Rules</h2>
      <div v-if="gameplayRules" class="fact-grid">
        <article class="fact-card"><span class="fact-label">Rules</span><strong>{{ gameplayRuleCounts.total }}</strong></article>
        <article class="fact-card"><span class="fact-label">Supported</span><strong>{{ gameplayRuleCounts.supported }}</strong></article>
        <article class="fact-card"><span class="fact-label">Partial / Deferred</span><strong>{{ gameplayRuleCounts.partial }} / {{ gameplayRuleCounts.deferred }}</strong></article>
        <article class="fact-card"><span class="fact-label">Execution</span><strong>{{ gameplayRules.bindingStatus === 'stale' ? 'Stale / disabled' : gameplayRules.execution.status === 'active' ? 'Active · supported slice' : 'Planning only' }}</strong></article>
      </div>
      <p v-else class="empty-state">No gameplay rule set is available for this session.</p>
      <article v-if="primaryGameplayRule" class="rule-detail">
        <strong>{{ primaryGameplayRule.ruleId }}</strong>
        <span v-if="primaryGameplayRule.sourceMechanicId">Source mechanic · {{ primaryGameplayRule.sourceMechanicId }}</span>
        <span>Trigger · {{ primaryGameplayRule.trigger.eventType }}</span>
        <span>Conditions · {{ primaryGameplayRule.conditions.length }} · {{ primaryGameplayRule.conditions.map(condition => condition.type).join(', ') || 'none' }}</span>
        <span>Actions · {{ primaryGameplayRule.actions.length }} · {{ primaryGameplayRule.actions.map(action => action.type).join(', ') || 'none' }}</span>
        <span>Support · {{ primaryGameplayRule.supportStatus }}</span>
      </article>
      <p v-if="gameplayRules" class="rule-execution-note">Runtime executes only current supported rules; deferred or stale rules remain gated.</p>
    </section>

    <section class="overview-section" aria-labelledby="visual-title">
      <h2 id="visual-title" class="overview-section-title">Visual Generation &amp; Assets</h2>
      <div class="fact-grid">
        <article class="fact-card"><span class="fact-label">Visual operations</span><strong>{{ visualCounts.total }}</strong></article>
        <article class="fact-card"><span class="fact-label">Ready / Active / Fallback</span><strong>{{ visualCounts.ready }} / {{ visualCounts.active }} / {{ visualCounts.fallback }}</strong></article>
        <article class="fact-card"><span class="fact-label">Manifest assets</span><strong>{{ assetCounts.total }}</strong></article>
        <article class="fact-card"><span class="fact-label">Generated / Static / Fallback</span><strong>{{ assetCounts.generated }} / {{ assetCounts.static }} / {{ assetCounts.fallback }}</strong></article>
      </div>
    </section>

    <section class="overview-section" aria-labelledby="system-title">
      <h2 id="system-title" class="overview-section-title">System</h2>
      <dl class="fact-list">
        <div><dt>Architecture version</dt><dd>{{ PROJECT_METADATA.architectureVersion }}</dd></div>
        <div><dt>Phase</dt><dd>{{ PROJECT_METADATA.currentSprint }}</dd></div>
      </dl>
    </section>
  </div>
</template>

<style scoped>
.observatory-overview { display: flex; flex-direction: column; gap: var(--obs-space-5); }
.overview-section-title { margin: 0 0 var(--obs-space-3); font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: var(--obs-text-dim); }
.fact-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: var(--obs-space-3); }
.fact-card, .fact-list > div { display: flex; flex-direction: column; gap: var(--obs-space-1); padding: var(--obs-space-4); border: 1px solid var(--obs-border); border-radius: var(--obs-radius-m); background: var(--obs-surface); }
.fact-card strong, .fact-list dd { margin: 0; color: var(--obs-text); font-family: var(--obs-font-mono); font-size: 14px; font-weight: 500; overflow-wrap: anywhere; }
.fact-label, .fact-list dt { color: var(--obs-text-dim); font-size: 11px; }
.fact-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: var(--obs-space-3); margin: 0; }
.empty-state { margin: 0; padding: var(--obs-space-4); border: 1px solid var(--obs-border); border-radius: var(--obs-radius-m); background: var(--obs-surface); color: var(--obs-text-dim); font-size: 13px; }
.rule-detail { display: flex; flex-direction: column; gap: var(--obs-space-1); margin-top: var(--obs-space-3); padding: var(--obs-space-3); border: 1px solid var(--obs-border); border-radius: var(--obs-radius-m); background: var(--obs-surface); color: var(--obs-text-dim); font-family: var(--obs-font-mono); font-size: 11px; }
.rule-detail strong { color: var(--obs-text); font-size: 12px; }
.rule-execution-note { margin: var(--obs-space-3) 0 0; color: var(--obs-text-dim); font-size: 12px; }
</style>
