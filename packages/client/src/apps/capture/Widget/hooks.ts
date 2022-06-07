import { LITTLE_ENDIAN } from '@/libs/codecs/common'
import { decodeConsoleEvent } from '@/libs/codecs/event'
import { logger } from '@/libs/logger'
import { useRecordingStream } from '@/libs/record'
import { LogLevel } from '@/types/console'
import { SourceEventType } from '@/types/recording'
import { copyArray } from '@/utils/lang'
import { BufferReader } from 'arraybuffer-utils'
import { useEffect, useState } from 'react'
import { ConsoleSummary } from './types'

function createEmptyConsoleSummary(): ConsoleSummary {
  return {
    [LogLevel.Verbose]: { recentMessages: [], total: 0 },
    [LogLevel.Info]: { recentMessages: [], total: 0 },
    [LogLevel.Warning]: { recentMessages: [], total: 0 },
    [LogLevel.Error]: { recentMessages: [], total: 0 },
  }
}

export function useConsoleSummary(maxHistorySize = 10) {
  const recordingStream = useRecordingStream()
  const [summary, setSummary] = useState(createEmptyConsoleSummary)

  useEffect(() => {
    // TODO: load historical console messages from recording buffer

    const subscription = recordingStream.tail().subscribe(buffer => {
      const reader = new BufferReader(buffer, 0, LITTLE_ENDIAN)
      const eventType = reader.readUint8()

      if (eventType === SourceEventType.Console) {
        const { data: message } = decodeConsoleEvent(reader)

        setSummary(summary => {
          const total = summary[message.level].total + 1
          const recentMessages = copyArray(
            summary[message.level].recentMessages
          )

          recentMessages.push(message)

          if (recentMessages.length > maxHistorySize) {
            recentMessages.shift()
          }

          return {
            ...summary,
            [message.level]: {
              total,
              recentMessages,
            },
          }
        })
      }
    })

    return () => {
      subscription.unsubscribe()
      setSummary(createEmptyConsoleSummary())
    }
  }, [recordingStream, setSummary])

  return summary
}
