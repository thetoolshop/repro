export interface StartCommand {
  name: 'start'
}

export interface StopCommand {
  name: 'stop'
}

export type Command =
  | StartCommand
  | StopCommand

export interface RecordingResponse {
  name: 'recording'
  payload: Recording
}

export type Response =
  | RecordingResponse

