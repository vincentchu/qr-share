import { Action, ActionCreator, Reducer, AnyAction } from 'redux'
import { FileStub, FileTransfer } from './shared'
import { ConnectionState } from '../handshake-api'

const keyFor = (stub: FileStub): string => [ stub.name, stub.size, stub.lastModified ].join('/')

const emptyFileStore = (metadata: FileStub): FileTransfer => ({
  bytesTransferred: 0,
  buffer: [],
})

const updateTransfer = (currentTransfer: FileTransfer, chunk: ArrayBuffer): FileTransfer => ({
  bytesTransferred: currentTransfer.bytesTransferred + chunk.byteLength,
  buffer: currentTransfer.buffer.concat([ chunk ])
})

const completedFile = (currentFile: FileStub, currentTransfer: FileTransfer): File => {
  if (currentFile.size !== currentTransfer.bytesTransferred) {
    throw new Error(`Received bytes note equal to file size ${currentTransfer.bytesTransferred} != ${currentFile.size}`)
  }

  const blob = new Blob(currentTransfer.buffer)
  const props = {
    type: currentFile.type,
    lastModified: currentFile.lastModified,
  }

  return new File([ blob ], currentFile.name, props)
}

export type Chunk = {
  fileUUID: string
  offset: number
  chunkBase64: string
}

export type ReceiverState = {
  connectionState: ConnectionState
  currentFile?: FileStub
  currentTransfer?: FileTransfer
  completedFiles: {
    [ key: string ]: File
  }
}

const InitialState: ReceiverState = {
  connectionState: 'connecting',
  completedFiles: {},
}

const START_FILE = 'state-receiver/START_FILE'
const END_FILE = 'state-receiver/END_FILE'
const END_TRANSFER = 'state-receiver/END_TRANSFER'
const ADD_CHUNK = 'state-receiver/ADD_CHUNK'
const CHANGE_STATE = 'state-receiver/CHANGE_STATE'

type StartFileAction = {
  fileUUID: string
  currentFile: FileStub
} & Action<string>

type EndFileAction = {
  fileUUID: string
} & Action<string>

type AddChunkAction = {
  chunk: Chunk
} & Action<string>

type ChangeConnectionStateAction = {
  connectionState: ConnectionState
} & Action<string>

type EndTransferAction = {
} & Action<string>

export const reducer: Reducer<ReceiverState, AnyAction> = (
  state: ReceiverState = InitialState,
  action: StartFileAction | EndFileAction | AddChunkAction | ChangeConnectionStateAction
) => {
  return state
  switch (action.type) {
    case START_FILE: {
      const { currentFile } = <StartFileAction>action
      const currentTransfer = emptyFileStore(currentFile)

      return {
        ...state,
        currentFile,
        currentTransfer,
      }
    }

    case END_FILE: {
      const { currentFile, currentTransfer, completedFiles } = state

      const key = keyFor(currentFile)
      const file = completedFile(currentFile, currentTransfer)

      const updatedFiles = {
        ...completedFiles,
        [ key ]: file,
      }

      return {
        ...state,
        completedFiles: updatedFiles,
        currentFile: undefined,
        currentTransfer: undefined,
      }
    }

    case ADD_CHUNK: {
      // const { chunk } = <AddChunkAction>action

      // const { currentTransfer } = state
      // const updatedTransfer = updateTransfer(currentTransfer, chunk)

      // return {
      //   ...state,
      //   currentTransfer: updatedTransfer,
      // }
      return state
    }

    case CHANGE_STATE: {
      const { connectionState } = <ChangeConnectionStateAction>action
      return {
        ...state,
        connectionState,
      }
    }

    default:
      return state
  }
}

export const startFile: ActionCreator<StartFileAction> = (fileUUID: string, currentFile: FileStub) => ({
  type: START_FILE,
  fileUUID,
  currentFile,
})

export const endFile: ActionCreator<EndFileAction> = (fileUUID: string) => ({
  type: END_FILE,
  fileUUID
})

export const addChunk: ActionCreator<AddChunkAction> = (chunk: Chunk) => ({
  type: ADD_CHUNK,
  chunk,
})

export const changeConnectionState: ActionCreator<ChangeConnectionStateAction> = (connectionState: ConnectionState) => ({
  type: CHANGE_STATE,
  connectionState,
})

export const endTransfer: ActionCreator<EndTransferAction> = () => ({
  type: END_TRANSFER
})
