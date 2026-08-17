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

For the web app, set `VITE_AI_ENABLED=true` and
`VITE_AI_GATEWAY_URL=http://127.0.0.1:8787/api/world-generation`.
