import { createError } from '@/utils/errors'
import { chain, FutureInstance, map, node, reject, resolve } from 'fluture'
import { Pool, PoolConfig, QueryResult, QueryResultRow } from 'pg'

export interface DatabaseClient {
  query<R extends QueryResultRow>(
    queryText: string,
    values: Array<any>
  ): FutureInstance<Error, QueryResult<R>>

  getOne<R extends QueryResultRow>(
    queryText: string,
    values: Array<any>
  ): FutureInstance<Error, R>

  getMany<R extends QueryResultRow>(
    queryText: string,
    values: Array<any>
  ): FutureInstance<Error, Array<R>>
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

  function getOne<R extends QueryResultRow>(
    queryText: string,
    values: Array<any>
  ): FutureInstance<Error, R> {
    return query<R>(queryText, values).pipe(
      chain(result => {
        if (result.rowCount === 1) {
          return resolve(result.rows[0] as R)
        }

        if (result.rowCount === 0) {
          return reject(noResults())
        }

        return reject(tooManyResults())
      })
    )
  }

  function getMany<R extends QueryResultRow>(
    queryText: string,
    values: Array<any>
  ): FutureInstance<Error, Array<R>> {
    return query<R>(queryText, values).pipe(map(result => result.rows))
  }

  return {
    query,
    getOne,
    getMany,
  }
}
