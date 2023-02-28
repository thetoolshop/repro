import { isLens, unwrapLens } from '@repro/typed-binary-encoder'
import { Response } from 'express'
import { fork, FutureInstance } from 'fluture'
import { isObservable } from 'rxjs'
import { isReadable } from 'stream'
import { env } from '~/config/env'
import {
  isBadRequest,
  isNotAuthenticated,
  isNotFound,
  isPermissionDenied,
} from './errors'

function isReadableStream(value: any): value is NodeJS.ReadableStream {
  return isReadable(value)
}

export function respondWithError(res: Response, error: Error) {
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

    if (env.DEBUG) {
      console.debug(error)
    }
  }

  res.json({ name: error.name, message })
}

export function respondWithValue<T>(res: Response, value: T) {
  if (value === null || value === undefined) {
    res.status(204)
    res.end()
  } else {
    res.status(200)

    if (isReadableStream(value)) {
      value.pipe(res)
    } else if (isObservable(value)) {
      res.header('Content-Type', 'text/plain')
      value.subscribe({
        next: data => res.write(data),
        complete: () => res.end(),

        // TODO
        error: err => {
          if (env.DEBUG) {
            console.trace(err)
          }
        },
      })
    } else if (isLens(value)) {
      res.header('Content-Type', 'application/octet-stream')
      const view = unwrapLens(value)
      res.end(Buffer.from(view.buffer))
    } else {
      res.json(value)
    }
  }
}

export function respondWith<T>(
  res: Response,
  future: FutureInstance<Error, T>
) {
  fork<Error>(error => respondWithError(res, error))<T>(value =>
    respondWithValue<T>(res, value)
  )(future)
}
