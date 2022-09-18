import { Team, User } from '@repro/domain'

declare global {
  namespace Express {
    interface Request {
      team: Team
      user: User
    }
  }
}
