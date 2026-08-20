import { buildMockObservatory } from './fixtures/observatoryMock'

Object.assign(globalThis, {
  __GENESIS_OBSERVATORY_TEST_FIXTURE__: buildMockObservatory(),
})
