import { Sample } from '@/types/recording'
import { SyntheticId } from './common'

export enum InteractionType {
  ViewportResize = 0,
  Scroll         = 1,
  PointerMove    = 2,
  PointerDown    = 3,
  PointerUp      = 4,
  KeyDown        = 5,
  KeyUp          = 6,
}

export type Point = [number, number]

export interface ViewportResize extends Sample<Point> {
  type: InteractionType.ViewportResize
}

export interface Scroll extends Sample<Point> {
  type: InteractionType.Scroll
  target: SyntheticId
}

export interface PointerMove extends Sample<Point> {
  type: InteractionType.PointerMove
}

export interface PointerDown {
  type: InteractionType.PointerDown
  targets: Array<SyntheticId>
  at: Point
}

export interface PointerUp {
  type: InteractionType.PointerUp
  targets: Array<SyntheticId>
  at: Point
}

export interface KeyDown {
  type: InteractionType.KeyDown
  key: string
}

export interface KeyUp {
  type: InteractionType.KeyUp
  key: string
}

export type Interaction =
  | ViewportResize
  | Scroll
  | PointerMove
  | PointerDown
  | PointerUp
  | KeyDown
  | KeyUp

export type ScrollMap = Record<SyntheticId, Point>
