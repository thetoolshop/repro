import { RecordingMetadata } from '@repro/domain'
import { Block, Grid } from 'jsxstyle'
import React from 'react'
import { Card } from '~/components/Card'
import { DefinitionList } from '~/components/DefinitionList'
import { colors } from '~/config/theme'
import { formatDate } from '~/utils/date'
import { ucfirst } from '~/utils/string'
import { EventHighlights } from './EventHighlights'
import { Summary } from './Summary'

interface Props {
  metadata: RecordingMetadata
}

export const Sidebar: React.FC<Props> = ({ metadata }) => (
  <Card>
    <Grid
      gridTemplateRows="auto 1fr auto"
      height="100%"
      marginH={-20}
      overflow="hidden"
    >
      <Summary metadata={metadata} />

      <Block backgroundColor={colors.slate['50']}>
        <EventHighlights />
      </Block>

      <Grid
        isolation="isolate"
        paddingH={10}
        gridTemplateColumns="max-content 1fr"
        fontSize={13}
        backgroundColor={colors.white}
        borderTop={`1px solid ${colors.slate['200']}`}
        boxShadow={`0 -4px 16px ${colors.slate['100']}`}
      >
        <DefinitionList
          title="Details"
          pairs={[
            ['Posted by', metadata.authorName],
            ['Created at', formatDate(metadata.createdAt)],
            [
              'Browser',
              metadata.browserName
                ? `${ucfirst(metadata.browserName)} ${metadata.browserVersion}`
                : null,
            ],
            ['OS', metadata.operatingSystem],
          ]}
        />
      </Grid>
    </Grid>
  </Card>
)
