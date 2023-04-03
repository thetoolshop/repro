import { RecordingMetadata } from '@repro/domain'
import { map } from 'fluture'
import { Block, Col, Row } from 'jsxstyle'
import { Chrome as ChromeIcon, Loader as LoaderIcon } from 'lucide-react'
import React from 'react'
import { Button } from '~/components/Button'
import { Card } from '~/components/Card'
import * as FX from '~/components/FX'
import { colors } from '~/config/theme'
import { useApiClient } from '~/libs/api'
import { useFuture } from '~/utils/future'
import { RecordingTile } from './RecordingTile'

function sortByCreated(recordings: Array<RecordingMetadata>) {
  return recordings.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
}

export const HomeRoute: React.FC = () => {
  const apiClient = useApiClient()

  function goToChromeWebStore() {
    window.location.href =
      'https://chrome.google.com/webstore/detail/repro/ecmbphfjfhnifmhbjhpejbpdnpanpice'
  }

  const {
    loading,
    error,
    result: recordings,
  } = useFuture(
    () => apiClient.recording.getAllRecordings().pipe(map(sortByCreated)),
    [apiClient]
  )

  if (loading) {
    return (
      <Card padding={0}>
        <Row
          height="calc(100vh - 90px)"
          alignItems="center"
          justifyContent="center"
        >
          <FX.Spin>
            <LoaderIcon />
          </FX.Spin>
        </Row>
      </Card>
    )
  }

  if (error) {
    return null
  }

  if (recordings.length) {
    return (
      <Card padding={0}>
        <Col
          minHeight="calc(100vh - 90px)"
          alignItems="center"
          justifyContent="center"
        >
          <Block
            padding={20}
            alignSelf="stretch"
            backgroundColor={colors.blue['50']}
            borderRadius="4px 4px 0 0"
          >
            <Block
              fontSize={24}
              fontWeight="bold"
              lineHeight={1.5}
              color={colors.blue['800']}
            >
              Welcome to Repro!
            </Block>

            <Block fontSize={16} lineHeight={1.5} color={colors.slate['700']}>
              Getting started is easy. Just download the Chrome extension and
              report your first bug.
            </Block>

            <Block marginTop={20}>
              <Button size="large" onClick={goToChromeWebStore}>
                <ChromeIcon size={20} />
                Download for Chrome
              </Button>
            </Block>
          </Block>

          <Block marginTop={40}>
            <img src="https://raw.githubusercontent.com/reprohq/repro/main/screenshots/repro-promo-image.png" />
          </Block>
        </Col>
      </Card>
    )
  }

  return (
    <Card padding={0}>
      <Block height="calc(100vh - 90px)" overflowY="auto">
        <Col gap={10} padding={20}>
          {recordings.map(recording => (
            <RecordingTile key={recording.id} recording={recording} />
          ))}
        </Col>
      </Block>
    </Card>
  )
}
