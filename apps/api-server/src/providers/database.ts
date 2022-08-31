import { createError } from '~/utils/errors'
import {
  attempt,
  chain,
  FutureInstance,
  map,
  node,
  reject,
  resolve,
} from 'fluture'
import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg'

export interface DatabaseClient {
  query<R extends QueryResultRow>(
    queryText: string,
    values: Array<any>
  ): FutureInstance<Error, QueryResult<R>>

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

function noResults() {
  return createError('NoResultsError')
}

function tooManyResults() {
  return createError('TooManyResultsError')
}

export function createDatabaseClient(config: PoolConfig): DatabaseClient {
  const pool = new Pool(config)

  function query<R extends QueryResultRow>(
    queryText: string,
    values: Array<any>
  ): FutureInstance<Error, QueryResult<R>> {
    return node<Error, QueryResult<R>>(done =>
      pool.query(queryText, values, done)
    )
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
          return reject(noResults())
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
    getOne,
    getMany,
  }
}
