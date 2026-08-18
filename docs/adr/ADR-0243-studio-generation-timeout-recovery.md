# ADR-0243: Studio Generation Timeout Recovery

**Status:** Accepted  
**Date:** 2026-08-18  
**Work Order:** WO-S13-006B  
**Architecture Version:** v1.130 (lifecycle recovery; no version increment)

## Context

The Studio passed the existing 30-second/2-attempt reliability settings to the
LLM provider wrapper, but the browser gateway client did not apply the request
timeout. A hanging gateway therefore prevented the provider wrapper from
returning and left the command UI at `Creating world…` indefinitely.

Browser product verification also exposed a renderer cleanup error: after a
primitive Graphics object was upgraded to a Sprite, the next render attempted
to destroy that Graphics object a second time.

## Decision

`BrowserStructuredGenerationClient` owns one AbortController timeout per
gateway request, using the existing reliability timeout (30 seconds by
default). It reports timeout, transport, and gateway/protocol failures as a
typed browser error; the existing AI retry and deterministic fallback remain
owned by `@genesis/ai`.

`DefaultPixiEntityRenderer.clear()` destroys either the active Sprite or the
primitive Graphics fallback, never both. Asset loading remains asynchronous
and cannot gate world creation.

## Consequences

- A gateway that never responds now reaches the existing retry/fallback path.
- Command state can reach success or error instead of remaining running.
- Static Sprite upgrades preserve primitive fallback and do not produce
  repeated Pixi destruction errors.
- Server-side provider timeout and retry policy remain unchanged.
