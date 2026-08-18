# Genesis AI Gateway

## Local startup

Create `packages/ai-server/.env.local` with the server-only `AI_*` values,
then run:

```sh
pnpm --filter @genesis/ai-server dev
```

The local file is ignored by Git and is read only by the server composition
root. Replace the values there when changing provider credentials or models.

The gateway listens on `http://127.0.0.1:8787`, serves `POST
/api/world-generation`, and exposes `GET /health`. `AI_BASE_URL` and `AI_HOST`
are optional. The API key is read only by this server package and is never
logged or returned to clients.

The session-only settings API exposes `GET`/`PUT /api/ai/config` and
`POST /api/ai/test`. It returns only public provider metadata; API keys remain
in server memory and are not persisted across an AI server restart. Updating
the configuration replaces the client used by subsequent generation requests.

Generation reliability is server-configured: `AI_MAX_OUTPUT_TOKENS` defaults to
4000, `AI_TIMEOUT_MS` to 30000, and `AI_MAX_ATTEMPTS` to 2 (one request plus one
retry). `AI_MAX_TOKENS` remains accepted as a compatibility alias. Retries are
limited to transient provider failures and output truncation; candidate
validation failures are not retried.

Image generation is a separate server-only boundary. Configure it with
`IMAGE_AI_PROVIDER` (`openai`, `openai-compatible`, `dashscope`, or
experimental `codex-cli`),
`IMAGE_AI_API_KEY`, `IMAGE_AI_MODEL` (default `gpt-image-1`, or
`qwen-image-3.0-pro` for DashScope), and optional `IMAGE_AI_BASE_URL`.
`IMAGE_AI_TIMEOUT_MS` defaults to 120000 and `IMAGE_AI_MAX_ATTEMPTS` defaults
to 1, capped at 2. It serves `POST /api/image-generation` and currently
supports only `text-to-image`. The response contains a normalized provider URL
or data URI; DashScope uses its native multimodal endpoint and returns a
provider-hosted PNG URL that expires after 24 hours. Transparency is requested
in the prompt when requested, but is not claimed as realized metadata. Image
credentials are never returned to clients.

Successful image generation is published into the current server session as
`GET /api/generated-assets/{artifactId}`. These artifacts are temporary and
are removed when the server restarts. The browser receives the generated
resource URL through the image gateway; it never receives provider data URIs or
provider credentials.

`codex-cli` starts the locally authenticated `codex exec` command in an
isolated temporary directory and expects it to write `generated.png`. It is an
experimental local adapter, not a stable Codex image API: it requires the
machine to have Codex CLI authentication and an ImageGen-capable CLI setup.
Set `CODEX_CLI_PATH` only when `codex` is not on PATH. The adapter is text-to-
image only and returns the PNG as a data URI; it does not persist generated
assets.

For the web app, set `VITE_AI_ENABLED=true` and
`VITE_AI_GATEWAY_URL=http://127.0.0.1:8787/api/world-generation`.
