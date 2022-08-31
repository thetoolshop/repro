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
    let message: string

    if (isNotFound(error)) {
      message = error.message || 'Not found'
      res.status(404)
    } else if (isNotAuthenticated(error)) {
      message = error.message || 'Not authenticated'
      res.status(401)
    } else if (isPermissionDenied(error)) {
      message = error.message || 'Permission denied'
      res.status(403)
    } else if (isBadRequest(error)) {
      message = error.message || 'Bad request'
      res.status(400)
    } else {
      console.error(error)
      message = error.message || 'Server error'
      res.status(500)
    }

    res.json({ success: false, error: message })
  })<T>(value => {
    res.status(200)
    res.json({ success: true, data: value })
  })(future)
}
