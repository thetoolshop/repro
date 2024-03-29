import { CodecVersion } from './migrations/types'

// Importing file from outside TypeScript root directory
// @ts-ignore
import pkg from '../package.json'

export const CODEC_VERSION = pkg.version as CodecVersion
export * from './generated/billing'
export * from './generated/common'
export * from './generated/console'
export * from './generated/event'
export * from './generated/interaction'
export * from './generated/network'
export * from './generated/performance'
export * from './generated/point'
export * from './generated/project'
export * from './generated/recording'
export * from './generated/session'
export * from './generated/snapshot'
export * from './generated/team'
export * from './generated/user'
export * from './generated/vdom'
export { migrate } from './migrations'
export type { CodecVersion }
