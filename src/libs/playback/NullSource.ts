import { NEVER } from 'rxjs'
import { Source } from '@/types/source'

export class NullSource implements Source {
  events() {
    return NEVER
  }

  metadata() {
    return NEVER
  }
}
