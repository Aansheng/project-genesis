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
  return {
    operationId: `image-generation-client-${request.assetId}`,
    assetId: request.assetId,
    mode: request.mode,
    status: 'running',
    artifactStatus: 'pending',
    input: { subject: request.subject, prompt: request.prompt, visualContext: request.visualContext },
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
