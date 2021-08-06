import { Source, SourceEvent } from '@/types/source'

const sleep = (time: number) => new Promise(resolve => {
  setTimeout(resolve, time)
})

export class FixtureSource implements Source {
  private data: Promise<Array<SourceEvent>>

  constructor(name: string) {
    this.data = fetch(`/fixtures/${name}.json`)
      .then(res => res.json())
  }

  async events() {
    await sleep(1000)
    return this.data
  }

  async metadata() {
    const events = await this.data
    const closeEvent = events.length
      ? events[events.length - 1] as SourceEvent
      : null

    return {
      duration: closeEvent !== null ? closeEvent.time : 0,
    }
  }
}
