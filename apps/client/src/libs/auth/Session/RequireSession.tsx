import React, { PropsWithChildren, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useSession } from './hooks'
import { IfSession } from './IfSession'

export const RequireSession: React.FC<PropsWithChildren> = ({ children }) => {
  const navigate = useNavigate()
  const session = useSession()

  useEffect(() => {
    if (!session) {
      navigate('/account/login')
    }
  }, [navigate, session])

  return <IfSession>{children}</IfSession>
}
