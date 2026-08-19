import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import type {
  GeneratedImageAsset,
  ImageGenerationFailure,
  ImageGenerationMode,
  ImageGenerationOperation,
  ImageGenerationProvider,
  ImageGenerationRequest,
  ImageGenerationResult,
} from '@genesis/shared'

export interface CodexCliImageGenerationProviderConfig {
  readonly cliPath?: string
  readonly timeoutMs: number
  readonly maxAttempts: number
}

export interface CodexCliRunResult {
  readonly exitCode: number
  readonly stdout: string
  readonly stderr: string
}

export type CodexCliRunner = (prompt: string, workdir: string, signal: AbortSignal) => Promise<CodexCliRunResult>

const supportedModes: readonly ImageGenerationMode[] = ['text-to-image']

function promptFor(request: ImageGenerationRequest, outputPath: string): string {
  const { artDirection, theme, palette } = request.visualContext
  const constraints = request.constraints
  return [
    'Use the ImageGen image generation capability to create one PNG image.',
    `Save the final image exactly to: ${outputPath}`,
    'Do not only describe the image and do not modify any other files.',
    'After saving it, reply with exactly one line: IMAGE_PATH=<absolute path>',
    `image prompt: ${request.prompt.trim()}`,
    request.subject?.trim(),
    `art direction: ${artDirection}`,
    `theme: ${theme.sourceTheme}; visual theme: ${theme.visualTheme}`,
    `palette: ${palette.temperature}, ${palette.contrast}, ${palette.mood}`,
    constraints?.assetKind ? `asset kind: ${constraints.assetKind}` : undefined,
    constraints?.view ? `view: ${constraints.view}` : undefined,
    constraints?.transparentBackground ? 'transparent background requested' : undefined,
    'sprite-oriented composition, no text, no logos',
  ].filter((value): value is string => Boolean(value)).join('\n')
}

function failure(code: ImageGenerationFailure['code'], message: string): ImageGenerationFailure { return { code, message } }

function operation(request: ImageGenerationRequest, operationId: string, status: ImageGenerationOperation['status'], output?: ImageGenerationOperation['output'], error?: ImageGenerationFailure): ImageGenerationOperation {
  return {
    operationId, assetId: request.assetId, mode: request.mode, status,
    input: { ...(request.subject ? { subject: request.subject } : {}), prompt: request.prompt, visualContext: request.visualContext },
    ...(output ? { output } : {}), ...(error ? { failure: error } : {}),
  }
}

function defaultRunner(cliPath: string): CodexCliRunner {
  return (prompt, workdir, signal) => new Promise((resolvePromise, reject) => {
    const child = spawn(cliPath, ['exec', '--ephemeral', '--json', '--skip-git-repo-check', '--sandbox', 'workspace-write', '--cd', workdir, prompt], { cwd: workdir, stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32' })
    let stdout = ''
    let stderr = ''
    let forceKill: ReturnType<typeof setTimeout> | undefined
    const kill = (name: NodeJS.Signals): void => {
      if (child.pid && process.platform !== 'win32') {
        try { process.kill(-child.pid, name); return } catch { /* fall back to the direct child */ }
      }
      try { child.kill(name) } catch { /* process already exited */ }
    }
    child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString() })
    child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString() })
    const abort = (): void => {
      kill('SIGTERM')
      forceKill = setTimeout(() => kill('SIGKILL'), 250)
    }
    const cleanup = (): void => {
      signal.removeEventListener('abort', abort)
      if (forceKill !== undefined) clearTimeout(forceKill)
    }
    signal.addEventListener('abort', abort, { once: true })
    child.once('error', (error) => { cleanup(); reject(error) })
    child.once('close', (exitCode) => { cleanup(); resolvePromise({ exitCode: exitCode ?? 1, stdout, stderr }) })
  })
}

function imagePathsFromJsonl(stdout: string): readonly string[] {
  const paths: string[] = []
  const collect = (value: unknown, key = ''): void => {
    if (typeof value === 'string') {
      const normalizedKey = key.toLowerCase()
      if ((normalizedKey.includes('image') || normalizedKey.includes('path') || normalizedKey.includes('file')) && /\.png$/u.test(value)) paths.push(value)
      return
    }
    if (Array.isArray(value)) {
      for (const item of value) collect(item, key)
      return
    }
    if (typeof value !== 'object' || value === null) return
    for (const [entryKey, entryValue] of Object.entries(value)) collect(entryValue, entryKey)
  }
  for (const line of stdout.split(/\r?\n/u)) {
    if (!line.trim()) continue
    try { collect(JSON.parse(line)) } catch { /* codex may emit non-JSON diagnostics */ }
  }
  return paths
}

function imagePathsFromOutput(stdout: string, expectedPath: string): readonly string[] {
  const generatedRoot = resolve(process.env.CODEX_HOME || join(homedir(), '.codex'), 'generated_images')
  const candidates = [
    ...imagePathsFromJsonl(stdout),
    stdout.match(/IMAGE_PATH=(.+)/u)?.[1]?.trim(),
    ...([...stdout.matchAll(/(\/[^\s"']+\.png)/gu)].map((match) => match[1])),
    expectedPath,
  ].filter((value): value is string => Boolean(value)).map((value) => resolve(value))
  return [...new Set(candidates)].filter((candidate) => candidate === expectedPath || candidate.startsWith(`${generatedRoot}/`))
}

async function readPngAsset(path: string, request: ImageGenerationRequest): Promise<GeneratedImageAsset> {
  const bytes = await readFile(path)
  if (bytes.length < 8 || !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) throw new Error('Codex CLI output is not a PNG')
  return { assetId: request.assetId, resource: { uri: `data:image/png;base64,${bytes.toString('base64')}` }, metadata: { mimeType: 'image/png' }, generationMode: request.mode }
}

/** Experimental server-only adapter around the locally authenticated Codex CLI. */
export class CodexCliImageGenerationProvider implements ImageGenerationProvider {
  private operationNumber = 0
  private readonly runner: CodexCliRunner

  constructor(private readonly config: CodexCliImageGenerationProviderConfig, runner?: CodexCliRunner) {
    this.runner = runner ?? defaultRunner(config.cliPath || 'codex')
  }

  supports(mode: ImageGenerationMode): boolean { return supportedModes.includes(mode) }

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const operationId = `image-generation-${++this.operationNumber}`
    if (!this.supports(request.mode)) {
      const error = failure('unsupported_mode', `Image generation mode is not supported: ${request.mode}`)
      return { status: 'failed', assetId: request.assetId, mode: request.mode, failure: error, operation: operation(request, operationId, 'failed', undefined, error) }
    }
    const attempts = Math.max(1, Math.min(2, Math.trunc(this.config.maxAttempts)))
    for (let attempt = 1; attempt <= attempts; attempt++) {
      const workdir = await mkdtemp(join(tmpdir(), 'genesis-codex-image-'))
      const outputPath = join(workdir, 'generated.png')
      const controller = new AbortController()
      let runPromise: Promise<CodexCliRunResult> | undefined
      let timeout: ReturnType<typeof setTimeout> | undefined
      try {
        await writeFile(join(workdir, 'request.txt'), promptFor(request, outputPath), 'utf8')
        runPromise = this.runner(promptFor(request, outputPath), workdir, controller.signal)
        const timedResult = new Promise<CodexCliRunResult>((resolveResult, rejectResult) => {
          timeout = setTimeout(() => {
            controller.abort()
            rejectResult(new Error('Codex CLI image generation timed out'))
          }, this.config.timeoutMs)
          runPromise!.then(resolveResult, rejectResult)
        })
        const result = await timedResult
        if (controller.signal.aborted) {
          const error = failure('timeout', 'Codex CLI image generation timed out')
          return { status: 'failed', assetId: request.assetId, mode: request.mode, failure: error, operation: operation(request, operationId, 'failed', undefined, error) }
        }
        try {
          for (const imagePath of imagePathsFromOutput(result.stdout, outputPath)) {
            try {
              const asset = await readPngAsset(imagePath, request)
              return { status: 'success', assetId: request.assetId, mode: request.mode, asset, operation: operation(request, operationId, 'succeeded', { resource: asset.resource, metadata: asset.metadata }) }
            } catch {
              continue
            }
          }
          throw new Error('Codex CLI did not produce a usable PNG')
        } catch {
          const error = failure(result.exitCode === 0 ? 'invalid_output' : attempt === attempts ? 'provider_unavailable' : 'generation_failed', 'Codex CLI did not produce a usable PNG')
          if (error.code === 'generation_failed') continue
          return { status: 'failed', assetId: request.assetId, mode: request.mode, failure: error, operation: operation(request, operationId, 'failed', undefined, error) }
        }
      } catch {
        if (controller.signal.aborted && runPromise) await Promise.race([runPromise.catch(() => undefined), new Promise<void>((resolveResult) => setTimeout(resolveResult, 500))])
        const error = failure(controller.signal.aborted ? 'timeout' : attempt === attempts ? 'provider_unavailable' : 'generation_failed', controller.signal.aborted ? 'Codex CLI image generation timed out' : 'Codex CLI could not be started')
        if (error.code === 'generation_failed') continue
        return { status: 'failed', assetId: request.assetId, mode: request.mode, failure: error, operation: operation(request, operationId, 'failed', undefined, error) }
      } finally {
        if (timeout !== undefined) clearTimeout(timeout)
        await rm(workdir, { recursive: true, force: true }).catch(() => undefined)
      }
    }
    throw new Error('Image generation attempt policy exhausted')
  }
}
