import {
  CODEC_VERSION,
  InteractionType,
  RecordingMode,
  SourceEvent,
  SourceEventType,
} from '@repro/domain'
import { Box } from '@repro/tdl'
import { toWireFormat } from '@repro/wire-formats'
import { FastifyInstance } from 'fastify'
import { chain, promise } from 'fluture'
import { Http2SecureServer } from 'http2'
import { encodeId } from '~/modules/database'
import { RecordingService } from '~/services/recording'
import { Harness, createTestHarness } from '~/testing'
import { readableToString } from '~/testing/utils'
import { createRecordingRouter } from './recording'

function expectISODate() {
  return expect.stringMatching(/^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}$/)
}

describe('Routers > Recording', () => {
  let harness: Harness
  let recordingService: RecordingService
  let app: FastifyInstance<Http2SecureServer>

  beforeEach(async () => {
    harness = await createTestHarness()
    recordingService = harness.services.recordingService
    app = harness.bootstrap(
      createRecordingRouter(
        harness.services.recordingService,
        harness.services.accountService
      )
    )
  })

  afterEach(async () => {
    await harness.reset()
  })

  it('should create a new recording', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/',
      body: {
        title: 'Title',
        url: 'https://repro.test',
        description: 'Description',
        mode: RecordingMode.Replay,
        duration: 10_000,
        browserName: 'Chromium',
        browserVersion: '120.0.0',
        operatingSystem: 'Linux x86_64',
      },
    })

    expect(res.statusCode).toEqual(201)
    expect(res.json()).toEqual({
      id: expect.any(String),
      title: 'Title',
      url: 'https://repro.test',
      description: 'Description',
      mode: RecordingMode.Replay,
      duration: 10_000,
      browserName: 'Chromium',
      browserVersion: '120.0.0',
      operatingSystem: 'Linux x86_64',
      createdAt: expectISODate(),
      codecVersion: CODEC_VERSION,
    })
  })

  it('should get info for a recording', async () => {
    const { id } = await promise(
      recordingService.writeInfo(
        'Title',
        'https://repro.test',
        'Description',
        RecordingMode.Replay,
        10_000,
        'Chromium',
        '120.0.0',
        'Linux x86_64'
      )
    )

    const res = await app.inject({
      method: 'GET',
      url: `/${id}/info`,
    })

    expect(res.statusCode).toEqual(200)
    expect(res.json()).toEqual({
      id,
      title: 'Title',
      url: 'https://repro.test',
      description: 'Description',
      mode: RecordingMode.Replay,
      duration: 10_000,
      browserName: 'Chromium',
      browserVersion: '120.0.0',
      operatingSystem: 'Linux x86_64',
      createdAt: expectISODate(),
      codecVersion: CODEC_VERSION,
    })
  })

  it('should save a resource for a recording', async () => {
    const { id } = await promise(
      recordingService.writeInfo(
        'Title',
        'https://repro.test',
        'Description',
        RecordingMode.Replay,
        10_000,
        'Chromium',
        '120.0.0',
        'Linux x86_64'
      )
    )

    const res = await app.inject({
      method: 'PUT',
      url: `/${id}/resources/foo`,
      body: 'foo-resource-data',
    })

    expect(res.statusCode).toEqual(201)

    const resource = await promise(
      recordingService
        .readResourceAsStream(id, 'foo')
        .pipe(chain(readableToString))
    )

    expect(resource).toEqual('foo-resource-data')
  })

  it('should save the resource map for a recording', async () => {
    const { id } = await promise(
      recordingService.writeInfo(
        'Title',
        'https://repro.test',
        'Description',
        RecordingMode.Replay,
        10_000,
        'Chromium',
        '120.0.0',
        'Linux x86_64'
      )
    )

    const res = await app.inject({
      method: 'PUT',
      url: `/${id}/resource-map`,
      body: {
        foo: 'https://example.com/foo.jpg',
        bar: 'https://example.com/bar.jpg',
        baz: 'https://example.com/baz.jpg',
      },
    })

    expect(res.statusCode).toEqual(201)

    const resourceMap = await promise(recordingService.readResourceMap(id))

    expect(resourceMap).toEqual({
      foo: 'https://example.com/foo.jpg',
      bar: 'https://example.com/bar.jpg',
      baz: 'https://example.com/baz.jpg',
    })
  })

  it('should save event data for a recording', async () => {
    const { id } = await promise(
      recordingService.writeInfo(
        'Title',
        'https://repro.test',
        'Description',
        RecordingMode.Replay,
        10_000,
        'Chromium',
        '120.0.0',
        'Linux x86_64'
      )
    )

    const events: Array<SourceEvent> = [
      new Box({
        type: SourceEventType.Interaction,
        time: 0,
        data: new Box({
          type: InteractionType.PointerMove,
          from: [0, 0],
          to: [100, 100],
          duration: 50,
        }),
      }),
      new Box({
        type: SourceEventType.Interaction,
        time: 0,
        data: new Box({
          type: InteractionType.PointerMove,
          from: [100, 100],
          to: [200, 200],
          duration: 35,
        }),
      }),
    ]

    const res = await app.inject({
      method: 'PUT',
      url: `/${id}/data`,
      body: events.map(toWireFormat).join('\n'),
    })

    expect(res.statusCode).toEqual(201)
  })

  it('should fail to overwrite an existing recording', async () => {
    const { id } = await promise(
      recordingService.writeInfo(
        'Title',
        'https://repro.test',
        'Description',
        RecordingMode.Replay,
        10_000,
        'Chromium',
        '120.0.0',
        'Linux x86_64'
      )
    )

    const eventsA: Array<SourceEvent> = [
      new Box({
        type: SourceEventType.Interaction,
        time: 0,
        data: new Box({
          type: InteractionType.PointerMove,
          from: [0, 0],
          to: [100, 100],
          duration: 50,
        }),
      }),
    ]

    const eventsB: Array<SourceEvent> = [
      new Box({
        type: SourceEventType.Interaction,
        time: 0,
        data: new Box({
          type: InteractionType.PointerMove,
          from: [100, 100],
          to: [0, 0],
          duration: 50,
        }),
      }),
    ]

    await app.inject({
      method: 'PUT',
      url: `/${id}/data`,
      body: eventsA.map(toWireFormat).join('\n'),
    })

    const res = await app.inject({
      method: 'PUT',
      url: `/${id}/data`,
      body: eventsB.map(toWireFormat).join('\n'),
    })

    expect(res.statusCode).toEqual(409)
  })

  it('should fail to write data for a recording that does not exist', async () => {
    const events: Array<SourceEvent> = [
      new Box({
        type: SourceEventType.Interaction,
        time: 0,
        data: new Box({
          type: InteractionType.PointerMove,
          from: [0, 0],
          to: [100, 100],
          duration: 50,
        }),
      }),
    ]

    const res = await app.inject({
      method: 'PUT',
      url: `/${encodeId(999)}/data`,
      body: events.map(toWireFormat).join('\n'),
    })

    expect(res.statusCode).toEqual(404)
  })

  // TODO: investigate - validating via a transform stream might add too much overhead
  it.skip('should fail to write invalid recording data', async () => {
    const { id } = await promise(
      recordingService.writeInfo(
        'Title',
        'https://repro.test',
        'Description',
        RecordingMode.Replay,
        10_000,
        'Chromium',
        '120.0.0',
        'Linux x86_64'
      )
    )

    const res = await app.inject({
      method: 'PUT',
      url: `/${id}/data`,
      body: 'Invalid event data',
    })

    expect(res.statusCode).toEqual(400)
  })
})
