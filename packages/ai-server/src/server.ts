import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import type { StructuredGenerationClient } from '@genesis/ai'
import { createAIGatewayHandler } from './gateway'

const ROUTE = '/api/world-generation'
const DEFAULT_HOST = '127.0.0.1'
const DEFAULT_PORT = 8787
const MAX_BODY_BYTES = 1_000_000

export interface AIServerOptions { readonly host?: string; readonly port?: number }
export interface AIServerHandle { readonly server: Server; readonly host: string; readonly port: number }

function configuredPort(value: string | undefined): number {
  const port = Number(value)
  return Number.isInteger(port) && port >= 0 && port <= 65535 ? port : DEFAULT_PORT
}

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    let size = 0
    request.setEncoding('utf8')
    request.on('data', (chunk: string) => {
      size += Buffer.byteLength(chunk)
      if (size > MAX_BODY_BYTES) {
        reject(new Error('Request body too large'))
        request.destroy()
        return
      }
      body += chunk
    })
    request.on('end', () => resolve(body))
    request.on('error', reject)
  })
}

function writeResponse(response: ServerResponse, result: Response): void {
  response.statusCode = result.status
  response.setHeader('content-type', 'application/json; charset=utf-8')
  response.setHeader('access-control-allow-origin', '*')
  response.setHeader('access-control-allow-headers', 'content-type')
  response.setHeader('access-control-allow-methods', 'POST, OPTIONS')
  result.arrayBuffer().then((body) => response.end(Buffer.from(body)))
}

function createRequest(request: IncomingMessage, body: string): Request {
  return new Request(`http://${request.headers.host ?? 'localhost'}${request.url ?? '/'}`, {
    method: request.method,
    headers: { 'content-type': request.headers['content-type'] ?? 'application/json' },
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : body,
  })
}

export async function startAIServer(client: StructuredGenerationClient, options: AIServerOptions = {}): Promise<AIServerHandle> {
  const handler = createAIGatewayHandler(client)
  const host = options.host ?? DEFAULT_HOST
  const port = options.port ?? configuredPort(process.env.AI_PORT)
  const server = createServer(async (request, response) => {
    if (request.method === 'OPTIONS') {
      response.statusCode = 204
      response.setHeader('access-control-allow-origin', '*')
      response.setHeader('access-control-allow-headers', 'content-type')
      response.setHeader('access-control-allow-methods', 'POST, OPTIONS')
      response.end()
      return
    }
    if (request.url?.split('?')[0] !== ROUTE) {
      writeResponse(response, Response.json({ error: 'Not found' }, { status: 404 }))
      return
    }
    try {
      writeResponse(response, await handler(createRequest(request, await readBody(request))))
    } catch {
      writeResponse(response, Response.json({ error: 'AI generation unavailable' }, { status: 502 }))
    }
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, host, () => { server.off('error', reject); resolve() })
  })
  const address = server.address()
  const actualPort = typeof address === 'object' && address !== null ? address.port : port
  return { server, host, port: actualPort }
}

export async function stopAIServer(server: Server | AIServerHandle): Promise<void> {
  const instance = 'server' in server ? server.server : server
  if (!instance.listening) return
  instance.closeIdleConnections()
  await new Promise<void>((resolve, reject) => instance.close((error) => error ? reject(error) : resolve()))
}
