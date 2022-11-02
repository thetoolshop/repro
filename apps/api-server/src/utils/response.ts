import { isLens, unwrapLens } from '@repro/typed-binary-encoder'
import { Response } from 'express'
import { fork, FutureInstance } from 'fluture'
import { env } from '~/config/env'
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
      message = env.DEBUG ? error.message : 'Server error'
      res.status(500)
    }

    if (env.DEBUG) {
      console.trace(error)
    }

    res.json({ name: error.name, message })
  })<T>(value => {
    if (value === null || value === undefined) {
      res.status(204)
      res.end()
    } else {
      res.status(200)

      if (isLens(value)) {
        res.header('Content-Type', 'application/octet-stream')
        const view = unwrapLens(value)
        res.end(Buffer.from(view.buffer))
      } else {
        res.json(value)
      }
    }
  })(future)
}
