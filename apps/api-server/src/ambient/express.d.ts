import { Team } from '~/types/team'
import { User } from '~/types/user'

declare global {
  namespace Express {
    interface Request {
      team: Team
      user: User
    }
  }
}
