import { spawn } from 'node:child_process'
import type { GameDesignPrompt, GameWorldGenerationRequest, StructuredGenerationClient, StructuredGenerationRequestOptions, StructuredGenerationFailureReason } from '@genesis/ai'
import { StructuredGenerationError } from '@genesis/ai'

export interface CodexCliStructuredGenerationClientConfig {
  readonly cliPath?: string
  readonly timeoutMs: number
  readonly maxAttempts: number
}

export interface CodexCliStructuredRunResult {
  readonly exitCode: number
  readonly stdout: string
  readonly stderr: string
}

export type CodexCliStructuredRunner = (prompt: string, signal: AbortSignal) => Promise<CodexCliStructuredRunResult>

const candidateShape = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  return Array.isArray(record.entities) && (typeof record.genre === 'string' || typeof record.worldType === 'string')
}

function parseJsonText(value: string): unknown {
  const text = value.trim().replace(/^```(?:json)?\s*/u, '').replace(/\s*```$/u, '')
  if (!text) return undefined
  try { return JSON.parse(text) as unknown } catch { return undefined }
}

function findCandidate(value: unknown): Record<string, unknown> | undefined {
  if (candidateShape(value)) return value
  if (typeof value === 'string') return findCandidate(parseJsonText(value))
  if (!value || typeof value !== 'object') return undefined
  if (Array.isArray(value)) {
    for (let index = value.length - 1; index >= 0; index--) {
      const candidate = findCandidate(value[index])
      if (candidate) return candidate
    }
    return undefined
  }
  const record = value as Record<string, unknown>
  for (const key of ['text', 'content', 'message', 'item', 'output', 'result', 'response']) {
    const candidate = findCandidate(record[key])
    if (candidate) return candidate
  }
  return undefined
}

/** Extracts only the final candidate from Codex JSONL; events never cross the domain boundary. */
export function extractCodexStructuredCandidate(stdout: string): unknown {
  const direct = findCandidate(parseJsonText(stdout))
  if (direct) return direct
  const lines = stdout.split(/\r?\n/u).map(line => line.trim()).filter(Boolean)
  for (let index = lines.length - 1; index >= 0; index--) {
    const candidate = findCandidate(parseJsonText(lines[index] ?? ''))
    if (candidate) return candidate
  }
  throw new StructuredGenerationError('malformed_response', 'Codex CLI did not return a structured game design candidate')
}

function defaultRunner(cliPath: string): CodexCliStructuredRunner {
  return (prompt, signal) => new Promise((resolve, reject) => {
    const child = spawn(cliPath, ['exec', '--ephemeral', '--json', '--skip-git-repo-check', prompt], { stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32' })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString() })
    child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString() })
    const terminate = (): void => {
      if (child.pid && process.platform !== 'win32') {
        try { process.kill(-child.pid, 'SIGTERM'); return } catch { /* fall through */ }
      }
      child.kill('SIGTERM')
    }
    signal.addEventListener('abort', terminate, { once: true })
    child.once('error', reject)
    child.once('close', (exitCode) => {
      signal.removeEventListener('abort', terminate)
      resolve({ exitCode: exitCode ?? 1, stdout, stderr })
    })
  })
}

export class CodexCliStructuredGenerationClient implements StructuredGenerationClient {
  readonly provider = 'codex-cli'
  private readonly runner: CodexCliStructuredRunner

  constructor(private readonly config: CodexCliStructuredGenerationClientConfig, runner?: CodexCliStructuredRunner) {
    this.runner = runner ?? defaultRunner(config.cliPath || 'codex')
  }

  getProviderMetadata(): { readonly provider: string } { return { provider: 'codex-cli' } }

  async checkAvailability(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const child = spawn(this.config.cliPath || 'codex', ['--version'], { stdio: 'ignore' })
      child.once('error', reject)
      child.once('close', code => code === 0 ? resolve() : reject(new Error('Codex CLI unavailable')))
    })
  }

  async generateStructured(request: GameWorldGenerationRequest, prompt?: GameDesignPrompt, options?: StructuredGenerationRequestOptions): Promise<unknown> {
    const maxAttempts = Math.max(1, Math.min(2, Math.trunc(this.config.maxAttempts)))
    const timeoutMs = options?.timeoutMs ?? this.config.timeoutMs
    const input = prompt ? `${prompt.system}\n\n${prompt.user}\n\nReturn only the JSON candidate object.` : JSON.stringify(request)
    let lastError: unknown
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), timeoutMs)
      try {
        const result = await this.runner(input, controller.signal)
        if (controller.signal.aborted) throw new StructuredGenerationError('timeout', 'Codex CLI structured generation timed out')
        if (result.exitCode !== 0) throw new StructuredGenerationError('provider_error', 'Codex CLI structured generation failed')
        return extractCodexStructuredCandidate(result.stdout)
      } catch (error) {
        lastError = error
        const reason: StructuredGenerationFailureReason = controller.signal.aborted ? 'timeout' : error instanceof StructuredGenerationError ? error.reason : 'provider_error'
        if (attempt === maxAttempts) throw new StructuredGenerationError(reason, error instanceof Error ? error.message : 'Codex CLI structured generation failed')
      } finally {
        clearTimeout(timeout)
      }
    }
    throw lastError instanceof Error ? lastError : new StructuredGenerationError('provider_error', 'Codex CLI structured generation failed')
  }
}
