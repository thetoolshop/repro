import { RecordingMetadata } from '@repro/domain'
import { Block, InlineBlock } from 'jsxstyle'
import React, { Fragment, useState } from 'react'
import { Drawer } from '~/components/Drawer'
import { Modal } from '~/components/Modal'
import { colors } from '~/config/theme'

interface Props {
  metadata: RecordingMetadata
}

const DESCRIPTION_LENGTH = 360

export const Summary: React.FC<Props> = ({ metadata }) => {
  const [showDescriptionDrawer, setShowDescriptionDrawer] = useState(false)

  const shouldTruncateDescription =
    metadata.description.length > DESCRIPTION_LENGTH

  let description = metadata.description

  if (shouldTruncateDescription) {
    description = description.slice(0, 360) + '...'
  }

  return (
    <Block
      isolation="isolate"
      paddingH={20}
      paddingBottom={20}
      boxShadow={`0 4px 16px ${colors.slate['200']}`}
      borderBottom={`1px solid ${colors.slate['200']}`}
    >
      <Block fontSize={20} lineHeight={1.25}>
        {metadata.title}
      </Block>

      <Block
        component="a"
        marginTop={10}
        fontSize={13}
        textDecoration="underline"
        lineHeight={1.25}
        color={colors.blue['700']}
        cursor="pointer"
        props={{
          href: metadata.url,
          target: '_blank',
        }}
      >
        {metadata.url}
      </Block>

      <Block
        marginTop={10}
        lineHeight={1.5}
        fontSize={13}
        textOverflow="ellipsis"
        emptyDisplay="none"
      >
        {description}

        {shouldTruncateDescription && (
          <InlineBlock
            marginLeft={5}
            fontWeight={700}
            color={colors.blue['700']}
            cursor="pointer"
            props={{
              onClick: () => setShowDescriptionDrawer(true),
            }}
          >
            Read More
          </InlineBlock>
        )}

        <Drawer
          open={showDescriptionDrawer}
          onClose={() => setShowDescriptionDrawer(false)}
        >
          {showDescriptionDrawer && (
            <Fragment>
              <Block
                paddingBottom={20}
                fontSize={20}
                fontWeight={700}
                color={colors.blue['700']}
              >
                Description
              </Block>

              <Block fontSize={13} lineHeight={1.5} whiteSpace="pre-wrap">
                {metadata.description}
              </Block>
            </Fragment>
          )}
        </Drawer>
      </Block>
    </Block>
  )
}
