export function createError(name: string, message: string = ''): Error {
  return new (class extends Error {
    name = name
    message = message
  })()
}

export function notAuthenticated(message: string = '') {
  return createError('NotAuthenticatedError', message)
}

export function isNotAuthenticated(error: Error) {
  return error.name === 'NotAuthenticatedError'
}

export function permissionDenied(message: string = '') {
  return createError('PermissionDeniedError', message)
}

export function isPermissionDenied(error: Error) {
  return error.name === 'PermissionDeniedError'
}

export function notFound(message: string = '') {
  return createError('NotFoundError', message)
}

export function isNotFound(error: Error) {
  return error.name === 'NotFoundError'
}

export function badRequest(message: string = '') {
  return createError('BadRequestError', message)
}

export function isBadRequest(error: Error) {
  return error.name === 'BadRequestError'
}

export function serverError(message: string = '') {
  return createError('ServerError', message)
}

export function isServerError(error: Error) {
  return error.name === 'ServerError'
}
