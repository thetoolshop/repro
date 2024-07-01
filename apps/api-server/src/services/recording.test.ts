import {
  InteractionType,
  SourceEvent,
  SourceEventType,
  SourceEventView,
} from '@repro/domain'
import { fromWireFormat, toWireFormat } from '@repro/wire-formats'
import { map, promise } from 'fluture'
import { Harness, createTestHarness, fixtures } from '~/testing'
import { readableToString, stringToReadable } from '~/testing/utils'
import { RecordingService } from './recording'

describe('Services > Recording', () => {
  let harness: Harness
  let recordingService: RecordingService

  beforeEach(async () => {
    harness = await createTestHarness()
    recordingService = harness.services.recordingService
  })

  afterEach(async () => {
    await harness.reset()
  })

  it('should correctly write and read recording data', async () => {
    const [recording] = await harness.loadFixtures([
      fixtures.recording.RecordingA,
    ])

    const events: Array<SourceEvent> = [
      SourceEventView.from({
        type: SourceEventType.Interaction,
        time: 0,
        data: {
          type: InteractionType.PointerMove,
          from: [0, 0],
          to: [1024, 1024],
          duration: 25,
        },
      }),
    ]

    const input = await promise(
      stringToReadable(events.map(toWireFormat).join('\n'))
    )

    await promise(recordingService.writeDataFromStream(recording.id, input))

    const data = await promise(recordingService.readDataAsStream(recording.id))

    const output = await promise(
      readableToString(data).pipe(
        map(value => value.split('\n').map<SourceEvent>(fromWireFormat))
      )
    )

    expect(output).toEqual(events)
  })
})
