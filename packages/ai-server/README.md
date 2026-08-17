# Genesis AI Gateway

## Local startup

```sh
AI_PROVIDER=openai \
AI_API_KEY=... \
AI_MODEL=gpt-4o-mini \
AI_PORT=8787 \
pnpm --filter @genesis/ai-server dev
```

The gateway listens on `http://127.0.0.1:8787`, serves `POST
/api/world-generation`, and exposes `GET /health`. `AI_BASE_URL` and `AI_HOST`
are optional. The API key is read only by this server package and is never
logged or returned to clients.

For the web app, set `VITE_AI_ENABLED=true` and
`VITE_AI_GATEWAY_URL=http://127.0.0.1:8787/api/world-generation`.
