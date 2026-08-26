import { describe, expect, it } from 'vitest'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { CodexCliImageGenerationProvider } from '../CodexCliImageGenerationProvider'
import type { ImageGenerationRequest } from '@genesis/shared'

const request: ImageGenerationRequest = {
  assetId: 'codex-player', mode: 'text-to-image', prompt: 'a stylized 2D game character',
  visualContext: {
    artDirection: 'stylized-2d',
    theme: { sourceTheme: 'forest', visualTheme: 'fantasy forest' },
    palette: { temperature: 'warm', contrast: 'standard', mood: 'bright' },
  },
}

const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

describe('CodexCliImageGenerationProvider', () => {
  it('normalizes a PNG written by the CLI runner', async () => {
    const provider = new CodexCliImageGenerationProvider({ timeoutMs: 1000, maxAttempts: 1 }, async (prompt, workdir) => {
      const outputPath = prompt.match(/Save the final image exactly to: (.+)/u)?.[1]
      if (!outputPath) throw new Error('missing output path')
      await writeFile(join(workdir, 'generated.png'), png)
      return { exitCode: 0, stdout: `IMAGE_PATH=${outputPath}`, stderr: '' }
    })
    const result = await provider.generate(request)
    expect(result).toMatchObject({ status: 'success', assetId: 'codex-player', asset: { metadata: { mimeType: 'image/png' }, generationMode: 'text-to-image' }, operation: { status: 'succeeded', input: { prompt: request.prompt, submittedPrompt: expect.stringContaining('image prompt: a stylized 2D game character') } } })
  })

  it('harvests a PNG path from a generated_images JSONL event', async () => {
    const provider = new CodexCliImageGenerationProvider({ timeoutMs: 1000, maxAttempts: 1 }, async (prompt, _workdir) => {
      const outputPath = prompt.match(/Save the final image exactly to: (.+)/u)?.[1]
      if (!outputPath) throw new Error('missing output path')
      await writeFile(outputPath, png)
      return { exitCode: 0, stdout: `{"type":"generated_images","generated_images":[{"path":"${outputPath}"}]}\n{"type":"completed"}`, stderr: '' }
    })
    await expect(provider.generate(request)).resolves.toMatchObject({ status: 'success', asset: { metadata: { mimeType: 'image/png' } } })
  })

  it('returns invalid_output when Codex exits without an image', async () => {
    const provider = new CodexCliImageGenerationProvider({ timeoutMs: 1000, maxAttempts: 1 }, async () => ({ exitCode: 0, stdout: 'done', stderr: '' }))
    await expect(provider.generate(request)).resolves.toMatchObject({ status: 'failed', failure: { code: 'invalid_output' } })
  })

  it('terminates the runner through the abort signal and returns a typed timeout', async () => {
    const provider = new CodexCliImageGenerationProvider({ timeoutMs: 5, maxAttempts: 1 }, async (_prompt, _workdir, signal) => {
      await new Promise<void>(resolve => signal.addEventListener('abort', () => resolve(), { once: true }))
      return { exitCode: 143, stdout: '', stderr: 'terminated' }
    })
    await expect(provider.generate(request)).resolves.toMatchObject({ status: 'failed', failure: { code: 'timeout' }, operation: { status: 'failed' } })
  })

  it('returns a timeout even when a runner ignores abort and never settles', async () => {
    let calls = 0
    const provider = new CodexCliImageGenerationProvider({ timeoutMs: 5, maxAttempts: 2 }, async () => {
      calls++
      await new Promise<void>(() => undefined)
      return { exitCode: 0, stdout: '', stderr: '' }
    })
    await expect(provider.generate(request)).resolves.toMatchObject({ status: 'failed', failure: { code: 'timeout' } })
    expect(calls).toBe(1)
  })

  it('rejects unsupported modes before starting the CLI', async () => {
    let called = false
    const provider = new CodexCliImageGenerationProvider({ timeoutMs: 1000, maxAttempts: 1 }, async () => { called = true; return { exitCode: 0, stdout: '', stderr: '' } })
    await expect(provider.generate({ ...request, mode: 'edit', sourceAsset: { assetId: 'source' } })).resolves.toMatchObject({ failure: { code: 'unsupported_mode' } })
    expect(called).toBe(false)
  })
})
