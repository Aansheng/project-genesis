<template>
  <section class="truth-empty" aria-labelledby="execution-graph-title">
    <h2 id="execution-graph-title">Execution Graph</h2>
    <p>No live execution graph is available for the current operation.</p>
    <span>The legacy static topology has been retired.</span>
  </section>
</template>

<style scoped>
.truth-empty { padding: var(--obs-space-5); border: 1px solid var(--obs-border); border-radius: var(--obs-radius-m); background: var(--obs-surface); }
h2 { margin: 0 0 var(--obs-space-2); color: var(--obs-text); font-size: 13px; }
p, span { margin: 0; color: var(--obs-text-dim); font-size: 13px; }
span { display: block; margin-top: var(--obs-space-1); font-size: 11px; }
</style>
