import { compare, hash } from 'bcrypt'
import { attempt, attemptP, FutureInstance, map, node } from 'fluture'
import fs from 'fs'
import { createError } from '~/utils/errors'
import {
  createPrivateKey,
  createPublicKey,
  KeyObject,
  privateEncrypt,
  publicDecrypt,
  randomBytes,
} from 'crypto'

export interface CryptoUtils {
  createHash(data: string): FutureInstance<Error, string>
  compareHash(data: string, hash: string): FutureInstance<Error, void>
  createRandomString(size?: number): FutureInstance<Error, string>
  importPrivateKey(path: string): FutureInstance<Error, KeyObject>
  importPublicKey(path: string): FutureInstance<Error, KeyObject>
  encrypt(data: string, privateKey: KeyObject): FutureInstance<Error, string>
  decrypt(data: string, publicKey: KeyObject): FutureInstance<Error, string>
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
      randomBytes(size / 2, (err, buf) => done(err, buf.toString('hex')))
    )
  }

  function importPrivateKey(path: string): FutureInstance<Error, KeyObject> {
    return node<Error, string>(done => fs.readFile(path, 'utf-8', done)).pipe(
      map(key => createPrivateKey(key))
    )
  }

  function importPublicKey(path: string): FutureInstance<Error, KeyObject> {
    return node<Error, string>(done => fs.readFile(path, 'utf-8', done)).pipe(
      map(key => createPublicKey(key))
    )
  }

  function encrypt(
    data: string,
    privateKey: KeyObject
  ): FutureInstance<Error, string> {
    return attempt(() =>
      privateEncrypt(privateKey, Buffer.from(data)).toString('hex')
    )
  }

  function decrypt(
    data: string,
    publicKey: KeyObject
  ): FutureInstance<Error, string> {
    return attempt(() =>
      publicDecrypt(publicKey, Buffer.from(data)).toString('hex')
    )
  }

  return {
    createHash,
    compareHash,
    createRandomString,
    importPrivateKey,
    importPublicKey,
    encrypt,
    decrypt,
  }
}
