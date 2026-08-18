# ADR-0247: Experimental Codex CLI Image Provider

**Status:** Experimental  
**Date:** 2026-08-18  
**Work Order:** Codex CLI image service prototype

## Decision

Genesis exposes the existing `POST /api/image-generation` route through
`IMAGE_AI_PROVIDER=codex-cli`. The server starts a locally authenticated
`codex exec --ephemeral --json` process, gives it an isolated temporary
workspace, and asks it to write one PNG to a fixed path. Only that PNG is
normalized into the existing Genesis image result contract.

The adapter supports text-to-image only, bounds execution time and attempts,
rejects paths outside its temporary workspace, validates the PNG signature, and
deletes the temporary workspace after each attempt.

This is not a stable public Codex image API. It depends on the installed CLI,
local authentication, and the CLI's access to ImageGen. Durable asset storage,
concurrency management, and production deployment remain out of scope.
