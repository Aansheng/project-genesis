# ADR-0235: AI Provider Configuration Foundation

- Status: Accepted
- Date: 2026-08-17
- Work Order: WO-S12-013
- Architecture Version: v1.122 → v1.123

## Decision

AI provider configuration is owned by a server-side, in-memory
`AIProviderConfigurationService`. Environment variables bootstrap the initial
session configuration. `PUT /api/ai/config` validates public settings and the
secret API key, then replaces the client used by subsequent generation
requests. In-flight requests are not changed.

The browser may read provider, model, base URL, enabled, and configured status
through `GET /api/ai/config`. It never receives the API key or a secret
configuration object. `POST /api/ai/test` performs a small structured request
through the configured client and returns only success or a safe error.

The first Studio settings surface supports OpenAI-compatible configuration,
including custom base URLs. No provider-specific DeepSeek logic, database
persistence, provider routing, or reliability controls are added. The API key
is cleared from the settings form after a successful save.

## Consequences

Configuration lasts only for the running AI server session and is not written
to browser storage or disk. Missing, disabled, or failed providers continue to
use the existing deterministic fallback path. A later persistence work order
must define server-side secret storage before claiming restart durability.
