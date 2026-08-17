<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { fetchAIConfiguration, saveAIConfiguration, testAIConfiguration, type AIProviderPublicConfiguration } from '../../ai/AISettingsClient'

const configuration = ref<AIProviderPublicConfiguration | null>(null)
const model = ref('')
const baseURL = ref('')
const apiKey = ref('')
const enabled = ref(false)
const status = ref('')
const busy = ref(false)

async function load(): Promise<void> {
  try {
    configuration.value = await fetchAIConfiguration()
    model.value = configuration.value.model
    baseURL.value = configuration.value.baseURL || ''
    enabled.value = configuration.value.enabled
  } catch (error) { status.value = error instanceof Error ? error.message : 'AI settings unavailable' }
}

async function save(): Promise<void> {
  busy.value = true
  try {
    configuration.value = await saveAIConfiguration({ provider: 'openai-compatible', model: model.value, baseURL: baseURL.value, apiKey: apiKey.value, enabled: enabled.value })
    apiKey.value = ''
    status.value = configuration.value.configured ? 'Configured' : 'Not configured'
  } catch (error) { status.value = error instanceof Error ? error.message : 'Unable to save AI settings' }
  finally { busy.value = false }
}

async function test(): Promise<void> {
  busy.value = true
  try {
    const result = await testAIConfiguration()
    status.value = result.success ? 'Connected' : (result.error || 'Connection failed')
  } catch (error) { status.value = error instanceof Error ? error.message : 'Connection failed' }
  finally { busy.value = false }
}

onMounted(load)
</script>

<template>
  <main class="settings-shell">
    <header class="settings-header">
      <RouterLink to="/" class="back-link">← Genesis Studio</RouterLink>
      <span>Settings</span>
    </header>
    <section class="settings-content">
      <div class="settings-heading">
        <p class="eyebrow">AI PROVIDER</p>
        <h1>AI Provider</h1>
        <p>Configure the server-side provider for world generation.</p>
      </div>
      <form class="settings-card" @submit.prevent="save">
        <label>Provider<select disabled><option>OpenAI Compatible</option></select></label>
        <label>Base URL<input v-model="baseURL" type="url" placeholder="https://api.openai.com/v1"></label>
        <label>Model<input v-model="model" required placeholder="gpt-4o-mini"></label>
        <label>API Key<input v-model="apiKey" type="password" autocomplete="new-password" placeholder="Enter key to update"></label>
        <label class="toggle"><input v-model="enabled" type="checkbox"> Enable AI generation</label>
        <div class="settings-actions"><button type="button" :disabled="busy" @click="test">Test Connection</button><button class="primary" type="submit" :disabled="busy">Save</button></div>
        <p class="status" role="status">Status: {{ status || (configuration?.configured ? 'Configured' : 'Not configured') }}</p>
        <p class="note">Configuration is held in server memory for this session. The API key is never returned to the browser.</p>
      </form>
    </section>
  </main>
</template>

<style scoped>
.settings-shell { --bg:#0c0d10; --surface:#111318; --raised:#171a20; --border:#272b34; --text:#eef0f4; --muted:#a4aab5; --dim:#6d7481; --accent:#7d9cff; min-height:100dvh; background:var(--bg); color:var(--text); font:13px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
.settings-header { height:52px; display:flex; align-items:center; justify-content:space-between; padding:0 20px; border-bottom:1px solid var(--border); background:var(--surface); font-weight:600; }
.back-link { color:var(--muted); text-decoration:none; }.back-link:hover { color:var(--text); }
.settings-content { width:min(560px, calc(100% - 40px)); margin:64px auto; }.settings-heading { margin-bottom:24px; }.eyebrow { color:var(--accent); font-size:10px; letter-spacing:.12em; }.settings-heading h1 { margin:4px 0; font-size:24px; }.settings-heading p:last-child,.note { color:var(--muted); }
.settings-card { display:grid; gap:16px; padding:24px; border:1px solid var(--border); border-radius:8px; background:var(--surface); } label { display:grid; gap:6px; color:var(--muted); } input,select { box-sizing:border-box; width:100%; height:36px; padding:0 10px; border:1px solid var(--border); border-radius:6px; background:var(--raised); color:var(--text); } input:focus { outline:2px solid var(--accent); outline-offset:1px; }.toggle { display:flex; grid-template-columns:none; align-items:center; flex-direction:row; gap:8px; }.toggle input { width:auto; }.settings-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:8px; } button { height:34px; padding:0 12px; border:1px solid var(--border); border-radius:6px; background:var(--raised); color:var(--text); cursor:pointer; } button.primary { border-color:var(--accent); background:var(--accent); color:#0c0d10; } button:disabled { opacity:.6; cursor:wait; }.status { margin:0; color:var(--text); }.note { margin:0; font-size:12px; }
</style>
