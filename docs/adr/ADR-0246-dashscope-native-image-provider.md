# ADR-0246: DashScope Native Image Provider

**Status:** Accepted  
**Date:** 2026-08-18  
**Work Order:** WO-S13-008B  
**Architecture Version:** v1.132 → v1.133

## Decision

`@genesis/ai-server` adds a dedicated `DashScopeImageGenerationProvider` beside
the OpenAI image adapter. It sends supported `text-to-image` requests to
DashScope's native multimodal endpoint and normalizes the synchronous response
into the existing Genesis image result and operation contracts.

`IMAGE_AI_PROVIDER=dashscope` selects the adapter. The provider uses the
server-only API key, defaults to `qwen-image-3.0-pro` and
`https://dashscope.aliyuncs.com`, and permits an explicit base URL override.
Image-to-image, edit, and reference-guided modes remain explicitly unsupported.

DashScope result URLs are temporary and retained by the provider for 24 hours.
The adapter records PNG dimensions when returned, but does not claim alpha or
transparent-background realization. Durable artifact ownership, background
removal, AssetManifest publication, and Pixi wiring remain future work.
