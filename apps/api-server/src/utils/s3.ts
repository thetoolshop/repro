import {
  GetObjectCommand,
  GetObjectCommandOutput,
  PutObjectCommand,
  PutObjectCommandOutput,
  S3Client,
} from '@aws-sdk/client-s3'
import { attemptP, chain, FutureInstance, reject, resolve } from 'fluture'
import { notFound } from './errors'

interface UploadMetadata {
  ContentType: string
  ContentLength: number
  ACL: string
}

export interface S3Utils {
  readFileAsStream(
    bucket: string,
    key: string
  ): FutureInstance<Error, ReadableStream>

  writeFileFromStream(
    bucket: string,
    key: string,
    body: ReadableStream,
    metadata: Partial<UploadMetadata>
  ): FutureInstance<Error, void>
}

export function createS3Utils(s3Client: S3Client): S3Utils {
  function readFileAsStream(
    bucket: string,
    key: string
  ): FutureInstance<Error, ReadableStream> {
    return attemptP<Error, GetObjectCommandOutput>(() =>
      s3Client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
    ).pipe(
      chain(response => {
        if (!response.Body) {
          return reject(notFound('Resource not found'))
        }

        return resolve(response.Body.transformToWebStream())
      })
    )
  }

  function writeFileFromStream(
    bucket: string,
    key: string,
    body: ReadableStream,
    metadata: Partial<UploadMetadata>
  ): FutureInstance<Error, void> {
    return attemptP<Error, PutObjectCommandOutput>(() =>
      s3Client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: metadata.ContentType,
          ContentLength: metadata.ContentLength,
          ACL: metadata.ACL,
        })
      )
    ).pipe(chain(() => resolve(undefined)))
  }

  return {
    readFileAsStream,
    writeFileFromStream,
  }
}
