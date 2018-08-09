import { Action, ActionCreator, Reducer, AnyAction } from 'redux'

export type FileStub = {
  lastModified: number
  name: string
  size: number
}

export type FileStore = {
  metadata: FileStub
  bytesReceived: number
  buffer: ArrayBuffer[]
}

const keyFor = (stub: FileStub): string => [ stub.name, stub.size, stub.lastModified ].join('/')

const emptyFileStore = (metadata: FileStub): FileStore => ({
  metadata,
  bytesReceived: 0,
  buffer: [],
})

const updateFileStore = (fileStore: FileStore, chunk: ArrayBuffer): FileStore => {
  return fileStore
}

export type ReceiverState = {
  currentFile?: FileStub
  files: {
    [ key: string ]: FileStore
  }
}

const InitialState: ReceiverState = {
  files: {}
}

const START_FILE = 'state-receiver/START_FILE'
const END_FILE = 'state-receiver/END_FILE'
const ADD_CHUNK = 'state-receiver/ADD_CHUNK'

type StartFileAction = {
  currentFile: FileStub
} & Action<string>

type EndFileAction = {} & Action<string>

type AddChunkAction = {
  chunk: ArrayBuffer
} & Action<string>

export const reducer: Reducer<ReceiverState, AnyAction> = (
  state: ReceiverState = InitialState,
  action: StartFileAction | EndFileAction | AddChunkAction
) => {
  switch (action.type) {
    case START_FILE: {
      const { currentFile } = <StartFileAction>action

      return {
        ...state,
        currentFile,
      }
    }

    case END_FILE:
      return {
        ...state,
        currentFile: undefined,
      }

    case ADD_CHUNK: {
      const { chunk } = <AddChunkAction>action

      const { currentFile } = state
      const key = keyFor(currentFile)
      const currentFileStore = state.files[key] || emptyFileStore(currentFile)
      const updatedStore = updateFileStore(currentFileStore, chunk)

      return {
        ...state,
        files: {
          ...state.files,
          [ key ]: updatedStore,
        }
      }
    }

    default:
      return state
  }
}

export const startFile: ActionCreator<StartFileAction> = (currentFile: FileStub) => ({
  type: START_FILE,
  currentFile,
})

export const endFile: ActionCreator<EndFileAction> = () => ({ type: END_FILE })

export const addChunk: ActionCreator<AddChunkAction> = (chunk: ArrayBuffer) => ({
  type: ADD_CHUNK,
  chunk,
})
