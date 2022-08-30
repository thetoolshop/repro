import { compare, hash } from 'bcrypt'
import { attemptP, FutureInstance, node } from 'fluture'
import { createError } from '@/utils/errors'
import { randomBytes } from 'crypto'

export interface CryptoUtils {
  createHash(data: string): FutureInstance<Error, string>
  compareHash(data: string, hash: string): FutureInstance<Error, void>
  createRandomString(): FutureInstance<Error, string>
}

export function createCryptoUtils(): CryptoUtils {
  function createHash(data: string): FutureInstance<Error, string> {
    return attemptP(() => hash(data, 10))
  }

  function compareHash(
    data: string,
    hash: string
  ): FutureInstance<Error, void> {
    return attemptP(() =>
      compare(data, hash).then(result => {
        result === true
          ? Promise.resolve()
          : Promise.reject(createError('HashMismatchError'))
      })
    )
  }

  function createRandomString(size = 32): FutureInstance<Error, string> {
    return node(done =>
      randomBytes(size, (err, buf) => done(err, buf.toString('hex')))
    )
  }

  return {
    createHash,
    compareHash,
    createRandomString,
  }
}
