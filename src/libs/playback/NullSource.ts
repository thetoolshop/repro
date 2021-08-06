import { Source } from '@/types/source'

export class NullSource implements Source {
  async events() {
    return []
  }

  async metadata() {
    return {
      duration: 0
    }
  }
}
