# Visual Capability Matrix

Architecture version: v1.131

This matrix distinguishes semantic intent from asset and renderer realization.

| Capability | Semantically represented | Asset specified | Asset resolved | Renderer realized |
| --- | --- | --- | --- | --- |
| Art direction | YES | NO | NO | NO |
| Theme refinement | YES | NO | NO | NO |
| Palette semantics | YES | NO | NO | NO |
| Environment / terrain semantics | YES | NO | NO | NO |
| Background semantics | YES | NO | NO | NO |
| Player visual role | YES | YES | YES | Sprite with primitive fallback |
| Generic enemy visual role | YES | YES | YES | Sprite with primitive fallback |
| Boss visual role | YES | YES | YES | Sprite with primitive fallback |
| Checkpoint / goal visual role | YES | YES | YES | Sprite with primitive fallback |
| Asset requirement representation | YES | YES | NO | NO |
| Asset identity | YES | YES | NO | NO |
| Entity → asset binding | YES | YES | NO | NO |
| Asset generated | NO | YES | NO | NO |
| Asset manifest | YES | YES | YES | NO |
| Partial resolution representation | YES | YES | YES | NO |
| Actual asset store | NO | NO | YES | YES |
| Asset resolver | YES | YES | YES | NO |
| Asset store | YES | YES | YES | NO |
| Static URI resolution | YES | YES | YES | NO |
| Binary/image decode | NO | NO | NO | NO |
| Pixi sprite rendering | NO | NO | YES | YES |
| Pixi texture adapter | NO | NO | YES | YES |
| Primitive fallback | YES | YES | YES | YES |
| Mixed sprite + primitive world | NO | NO | YES | YES |
| Production static asset wiring | YES | YES | YES | YES |
| Static character assets | YES | YES | YES | YES |
| Background asset rendering | NO | NO | NO | NOT YET |
| Tileset rendering | NO | NO | NO | NOT YET |
| Animation | NO | NO | NO | NOT YET |
| AI image generation | NO | NO | NO | NO |
| Image generation domain | YES | NO | NO | NO |
| Text-to-image request | YES | NO | NO | NO |
| Image-to-image request | YES | NO | NO | NO |
| Image edit request | YES | NO | NO | NO |
| Reference-guided request | YES | NO | NO | NO |
| Real image provider | NO | NO | NO | NOT YET |
| Generated asset storage | NO | NO | NO | NOT YET |
| Generated asset → manifest | NO | NO | NO | NOT YET |
| AI-generated sprite | NO | NO | NO | NOT YET |

The visual and asset layers are compiled deterministically from
`GameDesignSpecification`. Studio production wiring now resolves selected
repository-owned static character/prop fixtures and passes the manifest/store
to the Pixi renderer. Unresolved and failed entries retain primitive fallback.
Terrain/background textures, animation, provider execution, generated storage,
and generated-asset manifest publication remain deferred.
