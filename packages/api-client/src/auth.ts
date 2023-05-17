import { chain, FutureInstance, map } from 'fluture'
import { AuthStore, DataLoader } from './common'

export interface AuthApi {
  forgotPassword(email: string): FutureInstance<Error, void>
  login(email: string, password: string): FutureInstance<Error, void>
  logout(): FutureInstance<Error, void>
  register(
    name: string,
    company: string,
    email: string,
    password: string
  ): FutureInstance<Error, void>
}

export function createAuthApi(
  authStore: AuthStore,
  dataLoader: DataLoader
): AuthApi {
  function forgotPassword(email: string): FutureInstance<Error, void> {
    return dataLoader('/auth/forgot', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  function login(email: string, password: string): FutureInstance<Error, void> {
    const token = dataLoader<string>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
      }),
    })

    return token
      .pipe(chain(token => authStore.setSessionToken(token)))
      .pipe(map(() => undefined))
  }

  function logout(): FutureInstance<Error, void> {
    return dataLoader('/auth/logout', { method: 'POST' }).pipe(
      chain(() => authStore.clearSessionToken())
    )
  }

  function register(
    name: string,
    company: string,
    email: string,
    password: string
  ): FutureInstance<Error, void> {
    const token = dataLoader<string>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, company, email, password }),
    })

    return token
      .pipe(chain(token => authStore.setSessionToken(token)))
      .pipe(map(() => undefined))
  }

  return {
    forgotPassword,
    login,
    logout,
    register,
  }
}
