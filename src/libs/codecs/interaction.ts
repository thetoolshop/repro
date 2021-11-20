import { Interaction, ViewportResize } from '@/types/interaction'
import { BufferReader } from 'arraybuffer-utils'

export function encodeInteraction(interaction: Interaction): ArrayBuffer {}

export function decodeInteraction(reader: BufferReader): Interaction {}

export function encodeViewportResize(
  interaction: ViewportResize
): ArrayBuffer {}

export function decodeViewportResize(reader: BufferReader): ViewportResize {}
