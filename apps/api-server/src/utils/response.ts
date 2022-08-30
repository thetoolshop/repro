import { Response } from 'express'
import { fork, FutureInstance } from 'fluture'
import {
  isBadRequest,
  isNotAuthenticated,
  isNotFound,
  isPermissionDenied,
} from './errors'

export function respondWith<T>(
  res: Response,
  future: FutureInstance<Error, T>
) {
  fork<Error>(error => {
    if (isNotFound(error)) {
      res.status(404)
    } else if (isNotAuthenticated(error)) {
      res.status(401)
    } else if (isPermissionDenied(error)) {
      res.status(403)
    } else if (isBadRequest(error)) {
      res.status(400)
    } else {
      res.status(500)
    }

    res.json({ success: false, error })
  })<T>(value => {
    res.status(200)
    res.json({ success: true, data: value })
  })(future)
}
