import { useAtomValue } from '@repro/atom'
import { useContext } from 'react'
import { AuthContext } from './AuthProvider'

export function useAuthContext() {
  return useContext(AuthContext)
}

export function useSession() {
  const context = useAuthContext()
  return useAtomValue(context.$session)
}

export function useLogin() {
  const context = useAuthContext()
  return context.login
}

export function useLogout() {
  const context = useAuthContext()
  return context.logout
}

export function useResetPassword() {
  const context = useAuthContext()
  return context.resetPassword
}

export function useRegister() {
  const context = useAuthContext()
  return context.register
}
