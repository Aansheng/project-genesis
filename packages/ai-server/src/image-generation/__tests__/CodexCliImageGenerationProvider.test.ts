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
    expect(result).toMatchObject({ status: 'success', assetId: 'codex-player', asset: { metadata: { mimeType: 'image/png' }, generationMode: 'text-to-image' }, operation: { status: 'succeeded' } })
  })

  it('returns invalid_output when Codex exits without an image', async () => {
    const provider = new CodexCliImageGenerationProvider({ timeoutMs: 1000, maxAttempts: 1 }, async () => ({ exitCode: 0, stdout: 'done', stderr: '' }))
    await expect(provider.generate(request)).resolves.toMatchObject({ status: 'failed', failure: { code: 'invalid_output' } })
  })

  it('rejects unsupported modes before starting the CLI', async () => {
    let called = false
    const provider = new CodexCliImageGenerationProvider({ timeoutMs: 1000, maxAttempts: 1 }, async () => { called = true; return { exitCode: 0, stdout: '', stderr: '' } })
    await expect(provider.generate({ ...request, mode: 'edit', sourceAsset: { assetId: 'source' } })).resolves.toMatchObject({ failure: { code: 'unsupported_mode' } })
    expect(called).toBe(false)
  })
})
