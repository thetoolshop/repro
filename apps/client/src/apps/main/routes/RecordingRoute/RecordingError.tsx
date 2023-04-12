import { Card, colors } from '@repro/design'
import { Block, Col, Grid, Row } from 'jsxstyle'
import { AlertTriangle as AlertIcon } from 'lucide-react'
import React from 'react'
import { NavLink } from 'react-router-dom'
import { IfSession, UnlessSession } from '~/libs/auth/Session'

interface Props {
  error: Error
}

export const RecordingError: React.FC<Props> = ({ error }) => (
  <Grid
    height="calc(100vh - 90px)"
    gridTemplateColumns="1fr"
    gridTemplateRows="100%"
    marginH={-15}
    backgroundColor={colors.slate['50']}
  >
    <Row alignItems="center" justifyContent="center" height="100%">
      <Card>
        <Row gap={15}>
          <AlertIcon size={48} color={colors.slate['300']} />

          <Col gap={15}>
            <Block
              fontSize={18}
              fontWeight={700}
              color={
                error.name === 'ServerName'
                  ? colors.rose['700']
                  : colors.blue['700']
              }
            >
              {error.name === 'ServerError'
                ? 'Something went wrong'
                : 'Could not find recording'}
            </Block>

            <Block fontSize={15} color={colors.slate['700']}>
              {error.name === 'ServerError'
                ? 'There was an error loading this recording. Please try again.'
                : 'This recording does not exist.'}
            </Block>

            <UnlessSession>
              <Row
                alignItems="center"
                gap={5}
                paddingTop={15}
                fontSize={13}
                color={colors.slate['700']}
                borderTop={`1px solid ${colors.slate['200']}`}
              >
                <NavLink
                  to="/account/login"
                  style={{ color: colors.blue['700'] }}
                >
                  Log In
                </NavLink>

                <Block>or</Block>

                <NavLink
                  to="/account/signup"
                  style={{ color: colors.blue['700'] }}
                >
                  Create New Account
                </NavLink>
              </Row>
            </UnlessSession>

            <IfSession>
              <NavLink to="/recordings" style={{ color: colors.blue['700'] }}>
                Show all recordings
              </NavLink>
            </IfSession>
          </Col>
        </Row>
      </Card>
    </Row>
  </Grid>
)
