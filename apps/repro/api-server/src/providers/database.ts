import Future, {
  attempt,
  chain,
  FutureInstance,
  node,
  reject,
  resolve,
} from 'fluture'
import {
  Pool,
  PoolConfig,
  QueryResult,
  QueryResultRow,
  types as pgTypes,
} from 'pg'
import { from as copyFrom } from 'pg-copy-streams'
import QueryStream from 'pg-query-stream'
import { Observable } from 'rxjs'
import { Readable } from 'stream'
import { createError, notFound } from '~/utils/errors'

export interface DatabaseClient {
  query<R extends QueryResultRow>(
    queryText: string,
    values: Array<any>
  ): FutureInstance<Error, QueryResult<R>>

  queryAsStream<R extends QueryResultRow>(
    queryText: string,
    values: Array<any>
  ): FutureInstance<Error, Observable<R>>

  writeFromStream(
    table: string,
    columns: Array<string> | null,
    inputStream: Readable
  ): FutureInstance<Error, void>

  getOne<T extends QueryResultRow>(
    queryText: string,
    values: Array<any>
  ): FutureInstance<Error, T>

  getOne<T extends QueryResultRow, U>(
    queryText: string,
    values: Array<any>,
    resultSelector: (row: T) => U
  ): FutureInstance<Error, U>

  getMany<T extends QueryResultRow>(
    queryText: string,
    values: Array<any>
  ): FutureInstance<Error, Array<T>>

  getMany<T extends QueryResultRow, U>(
    queryText: string,
    values: Array<any>,
    resultSelector: (row: T) => U
  ): FutureInstance<Error, Array<U>>
}

function tooManyResults() {
  return createError('TooManyResultsError')
}

export function createDatabaseClient(config: PoolConfig): DatabaseClient {
  // Return JSON (114) and JSONB (3802) fields as string.
  // `pg` parses these automatically by default, but we need to
  // use custom View-specific parsing for recording events.
  pgTypes.setTypeParser(114, val => String(val))
  pgTypes.setTypeParser(3802, val => String(val))

  const pool = new Pool(config)

  function query<R extends QueryResultRow>(
    queryText: string,
    values: Array<any>
  ): FutureInstance<Error, QueryResult<R>> {
    return node<Error, QueryResult<R>>(done =>
      pool.query(queryText, values, done)
    )
  }

  function queryAsStream<R extends QueryResultRow>(
    queryText: string,
    values: Array<any>
  ): FutureInstance<Error, Observable<R>> {
    return Future((_, resolve) => {
      resolve(
        new Observable(observer => {
          const stream = new QueryStream(queryText, values)

          pool.connect((err, client, done) => {
            if (err) {
              observer.error(err)
              return
            }

            client.query(stream)

            stream.on('data', row => {
              observer.next(row)
            })

            stream.on('error', err => {
              observer.error(err)
              done()
            })

            stream.on('end', () => {
              observer.complete()
              done()
            })
          })

          return () => {
            stream.destroy()
          }
        })
      )

      return () => {}
    })
  }

  function writeFromStream(
    table: string,
    columns: Array<string> | null,
    inputStream: Readable
  ): FutureInstance<Error, void> {
    return Future((reject, resolve) => {
      pool.connect((err, client, done) => {
        if (err) {
          reject(err)
          return
        }

        const stream = client.query(
          copyFrom(`
            COPY ${table} ${columns ? `(${columns.join(', ')})` : ''}
            FROM STDIN
            WITH (FORMAT CSV, QUOTE E'\x01', DELIMITER E'\x02')
          `)
        )

        inputStream.on('error', err => {
          reject(err)
          done()
        })

        stream.on('error', err => {
          reject(err)
          done()
        })

        stream.on('finish', () => {
          resolve()
          done()
        })

        inputStream.pipe(stream)
      })

      return () => {
        inputStream.destroy()
      }
    })
  }

  function getOne(
    queryText: string,
    values: Array<any>,
    resultSelector?: (row: QueryResultRow) => any
  ): FutureInstance<Error, any> {
    return query(queryText, values).pipe(
      chain(result => {
        if (result.rowCount === 1) {
          const row = result.rows[0]!

          if (resultSelector) {
            return attempt<Error, any>(() => resultSelector(row))
          }

          return resolve(row)
        }

        if (result.rowCount === 0) {
          return reject(notFound())
        }

        return reject(tooManyResults())
      })
    )
  }

  function getMany(
    queryText: string,
    values: Array<any>,
    resultSelector?: (row: QueryResultRow) => any
  ): FutureInstance<Error, Array<any>> {
    return query(queryText, values).pipe(
      chain(result =>
        resultSelector
          ? attempt<Error, Array<any>>(() =>
              result.rows.map(row => resultSelector(row))
            )
          : resolve(result.rows)
      )
    )
  }

  return {
    query,
    queryAsStream,
    writeFromStream,
    getOne,
    getMany,
  }
}
