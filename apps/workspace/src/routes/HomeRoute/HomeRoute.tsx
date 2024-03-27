import { Card } from '@repro/design'
import { Block, Col } from 'jsxstyle'
import React from 'react'

export const HomeRoute: React.FC = () => {
  // function goToChromeWebStore() {
  //   window.location.href =
  //     'https://chrome.google.com/webstore/detail/repro/ecmbphfjfhnifmhbjhpejbpdnpanpice'
  // }

  return (
    <Card padding={0}>
      <Block height="calc(100vh - 90px)" overflowY="auto">
        <Col gap={10} padding={20}></Col>
      </Block>
    </Card>
  )
}
