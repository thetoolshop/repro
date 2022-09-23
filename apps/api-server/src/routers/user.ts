import express from 'express'
import { resolve } from 'fluture'
import { UserService } from '~/services/user'
import { respondWith } from '~/utils/response'

export function createUserRouter(_userService: UserService) {
  const UserRouter = express.Router()

  UserRouter.get('/me', (req, res) => {
    respondWith(res, resolve(req.user))
  })

  return UserRouter
}
