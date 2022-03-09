import { Row } from 'jsxstyle'
import React from 'react'
import { colors } from '@/config/theme'
import { Logo } from '@/components/Logo'
import { MAX_INT32 } from '../constants'
import { useNavigate } from '../hooks'
import { Location, useLocation } from 'react-router'

function matchesLocation(route: string, location: Location) {
  const pathname = location.pathname
    .replace(/^\//, '')
    .split('/')
    .slice(1)
    .join('/')

  return route.replace(/^\//, '') === pathname
}

export const Header: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const openPreview = () => {
    navigate('/')
  }

  const openDevTools = () => {
    navigate('/devtools')
  }

  return (
    <Container>
      <Row alignItems="center" paddingH={10}>
        <Logo size={20} />
      </Row>

      <NavItem active={matchesLocation('/', location)} onClick={openPreview}>
        Preview
      </NavItem>

      <NavItem
        active={matchesLocation('/devtools', location)}
        onClick={openDevTools}
      >
        DevTools
      </NavItem>
    </Container>
  )
}

const Container: React.FC = ({ children }) => (
  <Row
    alignItems="center"
    height={50}
    gap={8}
    background={colors.white}
    boxShadow="0 4px 16px rgba(0, 0, 0, 0.1)"
    isolation="isolate"
    zIndex={MAX_INT32}
  >
    {children}
  </Row>
)

interface NavItemProps {
  active: boolean
  onClick: () => void
}

const NavItem: React.FC<NavItemProps> = ({ children, active, onClick }) => {
  return (
    <Row
      alignItems="center"
      padding={12}
      backgroundColor={active ? colors.blue['100'] : 'transparent'}
      hoverBackgroundColor={active ? colors.blue['100'] : colors.slate['50']}
      color={colors.blue['900']}
      fontSize={14}
      borderRadius={4}
      cursor="pointer"
      props={{ onClick }}
    >
      {children}
    </Row>
  )
}
