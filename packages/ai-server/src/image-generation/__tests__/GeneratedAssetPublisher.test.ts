import { describe, expect, it } from 'vitest'
import { InMemoryGeneratedAssetPublisher } from '../GeneratedAssetPublisher'

describe('InMemoryGeneratedAssetPublisher', () => {
  it('publishes data URI bytes behind a Genesis-owned route', async () => {
    const publisher = new InMemoryGeneratedAssetPublisher()
    const published = await publisher.publish({
      assetId: 'player',
      resource: { uri: 'data:image/png;base64,iVBORw0KGgo=' },
      metadata: { mimeType: 'image/png' },
      generationMode: 'text-to-image',
    })
    expect(published).toMatchObject({ assetId: 'player', resource: { uri: '/api/generated-assets/generated-1.png' } })
    expect(publisher.serve('generated-1').status).toBe(200)
    expect(publisher.serve('missing').status).toBe(404)
  })

  it('downloads only supported image resources', async () => {
    const publisher = new InMemoryGeneratedAssetPublisher(async () => new Response(new Uint8Array([1]), { status: 200, headers: { 'content-type': 'image/png' } }))
    const published = await publisher.publish({ assetId: 'player', resource: { uri: 'https://provider.test/player.png' }, metadata: {}, generationMode: 'text-to-image' })
    expect(published.metadata.mimeType).toBe('image/png')
  })
})
