// Importing file from outside TypeScript root directory
// @ts-ignore
import pkg from '../package.json'

export const CODEC_VERSION = pkg.version

export * from './billing'
export * from './common'
export * from './console'
export * from './event'
export * from './interaction'
export * from './network'
export * from './point'
export * from './project'
export * from './recording'
export * from './session'
export * from './snapshot'
export * from './team'
export * from './user'
export * from './vdom'
