import { from, map, switchMapTo } from 'rxjs'
import { Source, SourceEvent } from '@/types/recording'
import { sleep } from '@/utils/debug'

export class FixtureSource implements Source {
  private data: Promise<Array<SourceEvent>>

  constructor(name: string) {
    this.data = fetch(`/fixtures/${name}.json`).then(res => res.json())
  }

  events() {
    return from(sleep(1000)).pipe(switchMapTo(from(this.data)))
  }

  metadata() {
    return from(this.data).pipe(
      map(events => {
        const closeEvent = events.length
          ? (events[events.length - 1] as SourceEvent)
          : null

        return {
          duration: closeEvent !== null ? closeEvent.time : Infinity,
        }
      })
    )
  }
}
