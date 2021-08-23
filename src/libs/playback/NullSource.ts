import { NEVER } from 'rxjs'
import { Source } from '@/types/recording'

export class NullSource implements Source {
  events() {
    return NEVER
  }

  metadata() {
    return NEVER
  }
}
