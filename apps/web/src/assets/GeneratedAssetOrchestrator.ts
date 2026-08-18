import type {
  AssetManifest,
  AssetResolutionInput,
  AssetSpecification,
  ImageGenerationOperation,
  ImageGenerationResult,
} from '@genesis/shared'
import { DefaultAssetManifestBuilder } from '@genesis/shared'
import type { BrowserImageGenerationClient } from '../ai/BrowserImageGenerationClient'
import { buildImageGenerationRequest, selectAiGenerationRequirement } from './AssetGenerationPolicy'

export function createPendingImageGenerationOperation(
  request: ReturnType<typeof buildImageGenerationRequest>,
): ImageGenerationOperation {
  const startedAt = new Date().toISOString()
  return {
    operationId: `image-generation-client-${request.assetId}`,
    assetId: request.assetId,
    ...(request.entityId ? { entityId: request.entityId } : {}),
    mode: request.mode,
    status: 'running',
    stage: 'preparing',
    assetKind: request.constraints?.assetKind,
    artifactStatus: 'pending',
    manifestStatus: 'pending',
    assetResolutionStatus: 'pending',
    rendererStatus: 'pending',
    fallback: 'static',
    startedAt,
    input: { subject: request.subject, prompt: request.prompt, visualContext: request.visualContext },
  }
}

export function finishImageGenerationOperation(
  operation: ImageGenerationOperation,
  patch: Partial<ImageGenerationOperation> & { readonly status: ImageGenerationOperation['status'] },
): ImageGenerationOperation {
  if (operation.stage === 'ready' || operation.stage === 'fallback') return operation
  const completedAt = patch.completedAt ?? (patch.stage === 'ready' || patch.stage === 'fallback' ? new Date().toISOString() : undefined)
  const durationMs = completedAt && operation.startedAt
    ? Math.max(0, Date.parse(completedAt) - Date.parse(operation.startedAt))
    : patch.durationMs
  return {
    ...operation,
    ...patch,
    ...(completedAt ? { completedAt } : {}),
    ...(durationMs !== undefined ? { durationMs } : {}),
  }
}

export function buildGeneratedAssetManifest(
  specification: AssetSpecification,
  currentManifest: AssetManifest,
  result: Extract<ImageGenerationResult, { status: 'success' }>,
): AssetManifest {
  const resolutions: Record<string, AssetResolutionInput> = {}
  for (const entry of currentManifest.entries) {
    if (entry.status === 'resolved' && entry.resource) {
      resolutions[entry.assetId] = { origin: entry.origin, resource: entry.resource, metadata: entry.metadata }
    }
  }
  resolutions[result.assetId] = {
    status: 'resolved',
    origin: 'generated',
    resource: result.asset.resource,
    metadata: result.asset.metadata,
  }
  return new DefaultAssetManifestBuilder().build(specification, resolutions)
}

export async function generateEligiblePlayerArtwork(
  specification: AssetSpecification,
  manifest: AssetManifest,
  client: BrowserImageGenerationClient,
): Promise<{ readonly result?: ImageGenerationResult; readonly manifest?: AssetManifest }> {
  const requirement = selectAiGenerationRequirement(specification)
  if (!requirement) return {}
  const result = await client.generate(buildImageGenerationRequest(specification, requirement))
  if (result.status !== 'success') return { result }
  return { result, manifest: buildGeneratedAssetManifest(specification, manifest, result) }
}
