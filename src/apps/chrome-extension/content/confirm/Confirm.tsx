import { motion } from 'framer-motion'
import { Block, Row } from 'jsxstyle'
import React, { useState } from 'react'
import {
  Check as CheckIcon,
  Loader as LoaderIcon,
} from 'react-feather'
import { Modal } from '@/components/Modal'
import { Logo } from '@/components/Logo'
import { colors } from '@/config/theme'

enum Step {
  Processing = 0,
  Encrypting = 1,
  Uploading  = 2,
  Done       = 3,
}

export const Confirm: React.FC = () => {
  const [step] = useState(Step.Encrypting)

  return (
    <Modal width="auto" height="auto">
      <Layout>
        <Logo size={20} />
        <List>
          <StepItem
            position={Step.Processing - step}
          >Processing recording</StepItem>

          <StepItem
            position={Step.Encrypting - step}
          >Packing and encrypting data</StepItem>

          <StepItem
            position={Step.Uploading - step}
          >Uploading to cloud storage</StepItem>
        </List>
      </Layout>
    </Modal>
  )
}

interface StepProps {
  position: number
}

const StepItem: React.FC<StepProps> = ({ children, position }) => (
  <Item>
    <Accent muted={position >= 0}>
      {position === 0
        ? <Loader />
        : position < 0
          ? <CheckIcon size={16} />
          : <Block width={16} />}
    </Accent>

    <Accent muted={position > 0}>
      {children}
    </Accent>
  </Item>
)

const Layout: React.FC = ({ children }) => (
  <Block padding={10}>
    {children}
  </Block>
)

const List: React.FC = ({ children }) => (
  <Block marginH={10} marginV={15}>
    {children}
  </Block>
)

const Item: React.FC = ({ children }) => (
  <Row marginTop={10} alignItems="center" gap={10}>
    {children}
  </Row>
)

interface AccentProps {
  muted: boolean
}

const Accent: React.FC<AccentProps> = ({ children, muted }) => (
  <Block color={muted ? colors.blueGray['200'] : colors.blueGray['700']}>
    {children}
  </Block>
)

const Loader: React.FC = () => (
  <motion.div
    style={{ 
      height: 16,
      transformOrigin: 'center center',
    }}

    animate={{
      rotate: 360,
    }}

    transition={{
      duration: 1,
      ease: 'linear',
      repeat: Infinity,
    }}
  >
    <LoaderIcon size={16} />
  </motion.div>
)
