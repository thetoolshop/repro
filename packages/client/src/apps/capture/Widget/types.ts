import { ConsoleMessage, LogLevel } from '@/types/console'

export type ConsoleSummary = Record<
  LogLevel,
  {
    recentMessages: Array<ConsoleMessage>
    total: number
  }
>
