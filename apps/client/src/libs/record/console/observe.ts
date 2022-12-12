import StackTrace, { StackTraceOptions } from 'stacktrace-js'
import {
  ConsoleMessage,
  LogLevel,
  MessagePartType,
  StackEntry,
} from '@repro/domain'
import { ObserverLike } from '~/utils/observer'

export function createConsoleObserver(
  subscriber: (message: ConsoleMessage) => void
): ObserverLike {
  const bind = Function.prototype.bind
  const log = bind.call(console.log, console)
  const info = bind.call(console.info, console)
  const warn = bind.call(console.warn, console)
  const error = bind.call(console.error, console)
  const debug = bind.call(console.debug, console)

  async function getStackEntries(error?: Error): Promise<Array<StackEntry>> {
    // TODO: find more robust way to exclude Repro from call stack
    const options: StackTraceOptions = {
      filter: frame =>
        !frame.fileName || !frame.fileName.startsWith('chrome-extension://'),
    }

    const frames = error
      ? StackTrace.fromError(error, options)
      : StackTrace.get(options)

    return (await frames).map(frame => ({
      functionName: frame.functionName || null,
      fileName: frame.fileName || '',
      lineNumber: frame.lineNumber || 0,
      columnNumber: frame.columnNumber || 0,
    }))
  }

  function catchError(this: Window, ev: ErrorEvent) {
    ;(async function () {
      subscriber({
        level: LogLevel.Error,
        parts: [
          {
            type: MessagePartType.String,
            value: ev.message,
          },
        ],
        stack: await getStackEntries(ev.error),
      })
    })()
  }

  function catchUnhandledRejection(this: Window, ev: PromiseRejectionEvent) {
    ;(async function () {
      subscriber({
        level: LogLevel.Error,
        parts: [
          {
            type: MessagePartType.String,
            value: ev.reason.toString(),
          },
        ],
        stack: await getStackEntries(),
      })
    })()
  }

  function patchConsoleMethod(
    level: LogLevel,
    original: (...args: any[]) => void
  ) {
    return new Proxy(original, {
      apply(target, thisArg, args) {
        Reflect.apply(target, thisArg, args)
        ;(async function () {
          subscriber({
            level,
            parts: args.map(value => {
              if (typeof value === 'undefined') {
                return {
                  type: MessagePartType.Undefined,
                }
              }

              if (value instanceof Date) {
                return {
                  type: MessagePartType.Date,
                  year: value.getUTCFullYear(),
                  month: value.getUTCMonth(),
                  day: value.getUTCDate(),
                  hour: value.getUTCHours(),
                  minute: value.getUTCMinutes(),
                  second: value.getUTCSeconds(),
                  millisecond: value.getUTCMilliseconds(),
                  timezoneOffset: value.getTimezoneOffset(),
                }
              }

              let serializedValue: string

              try {
                serializedValue = JSON.stringify(value)
              } catch {
                serializedValue = value.toString()
              }

              return {
                type: MessagePartType.String,
                value: serializedValue,
              }
            }),
            stack: await getStackEntries(),
          })
        })()
      },
    })
  }

  return {
    observe() {
      console.log = patchConsoleMethod(LogLevel.Info, log)
      console.info = patchConsoleMethod(LogLevel.Info, info)
      console.warn = patchConsoleMethod(LogLevel.Warning, warn)
      console.error = patchConsoleMethod(LogLevel.Error, error)
      console.debug = patchConsoleMethod(LogLevel.Verbose, debug)

      window.addEventListener('error', catchError)
      window.addEventListener('unhandledrejection', catchUnhandledRejection)
    },

    disconnect() {
      console.log = log
      console.info = info
      console.warn = warn
      console.error = error
      console.debug = debug

      window.removeEventListener('error', catchError)
      window.removeEventListener('unhandledrejection', catchUnhandledRejection)
    },
  }
}
