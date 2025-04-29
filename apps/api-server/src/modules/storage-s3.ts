import {
  GetObjectCommand,
  GetObjectCommandOutput,
  HeadObjectCommand,
  HeadObjectCommandOutput,
  PutObjectCommand,
  PutObjectCommandOutput,
  S3Client,
} from '@aws-sdk/client-s3'
import {
  attemptP,
  bichain,
  FutureInstance,
  map,
  reject,
  resolve,
} from 'fluture'
import { Readable } from 'node:stream'
import { Storage } from './storage'

interface Config {
  region: string
  bucket: string
  accessKeyId: string
  secretAccessKey: string
}

export function createS3StorageClient(config: Config): Storage {
  const s3 = new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })

  function exists(path: string): FutureInstance<Error, boolean> {
    const res = attemptP<Error, HeadObjectCommandOutput>(() =>
      s3.send(
        new HeadObjectCommand({
          Bucket: config.bucket,
          Key: path,
        })
      )
    )

    return res.pipe(
      bichain<Error, Error, boolean>(error => {
        if (error.name === 'NotFound') {
          return resolve(false)
        }

        return reject(error)
      })(() => resolve(true))
    )
  }

  function read(path: string): FutureInstance<Error, Readable> {
    const res = attemptP<Error, GetObjectCommandOutput>(() =>
      s3.send(
        new GetObjectCommand({
          Bucket: config.bucket,
          Key: path,
        })
      )
    )

    return res.pipe(
      map(output => {
        return output.Body != null ? (output.Body as Readable) : new Readable()
      })
    )
  }

  function write(path: string, data: Readable): FutureInstance<Error, void> {
    const res = attemptP<Error, PutObjectCommandOutput>(() =>
      s3.send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: path,
          Body: data,
        })
      )
    )

    return res.pipe(map(() => void 0))
  }

  return {
    exists,
    read,
    write,
  }
}
