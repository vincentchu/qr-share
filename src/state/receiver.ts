import { Action, ActionCreator, Reducer, AnyAction } from 'redux'

import { FileStub, FileTransfer } from './shared'
import { fromBase64Str } from '../crypto-utils'
import { ChunkSize } from '../views/Send/file-sender'
import { ConnectionState } from '../handshake-api'

const emptyFileTransfer = (fileSize: number): FileTransfer => {
  const numChunks = Math.ceil(fileSize / ChunkSize)

  return {
    bytesTransferred: 0,
    buffer: new Array(numChunks)
  }
}

const filePartsComplete = (parts: ArrayBuffer[]): boolean => {
  return parts.findIndex((part) => typeof part === 'undefined') === -1
}


// const updateTransfer = (currentTransfer: FileTransfer, chunk: ArrayBuffer): FileTransfer => ({
//   bytesTransferred: currentTransfer.bytesTransferred + chunk.byteLength,
//   buffer: currentTransfer.buffer.concat([ chunk ])
// })

const completedFile = (expectedSize: number, inProgress: FileTransfer): File => {
  let file: File

  if (filePartsComplete(inProgress.buffer)) {
    if (expectedSize !== inProgress.bytesTransferred) {
      console.trace('HMMM unexpected file size', expectedSize, inProgress.bytesTransferred)
      // throw new Error(`Received bytes note equal to file size ${currentTransfer.bytesTransferred} != ${currentFile.size}`)
    }

    const blob = new Blob(inProgress.buffer)
    const props = {
      type: 'image/png', // currentFile.type,
      lastModified: 0, //currentFile.lastModified,
    }
    file = new File([ blob ], 'foo.png', props)
  }

  return file
}

export type Chunk = {
  fileUUID: string
  offset: number
  chunkBase64: string
  size: number,
}

type FilesInProgress = {
  [ key: string ]: FileTransfer
}

export type ReceiverState = {
  connectionState: ConnectionState
  currentFile?: FileStub
  currentTransfer: number

  filesInProgress: FilesInProgress

  completedFiles: {
    [ key: string ]: File
  }
}

type AppendChunkResp = {
  filesInProgress: FilesInProgress,
  file?: File
}

const appendChunk = (inProgress: FilesInProgress, fileUUID: string, size: number, offset: number, buffer: ArrayBuffer): AppendChunkResp => {
  const inProgressFile = inProgress[fileUUID] || emptyFileTransfer(size)
  const idx = Math.floor(offset / ChunkSize)

  inProgressFile.buffer[idx] = buffer
  inProgressFile.bytesTransferred += buffer.byteLength

  console.log('>>> BYTES TRANSFERRED', inProgress.bytesTransferred)

  let file = completedFile(size, inProgressFile)
  console.log('>> FILE', file)

  const updatedInProgress = {
    ...inProgress,
    [ fileUUID ]: inProgressFile,
  }

  return {
    filesInProgress: updatedInProgress,
    file,
  }
}

const updateWithChunk = (state: ReceiverState, chunk: Chunk): ReceiverState => {
  const { fileUUID, offset, chunkBase64, size } = chunk
  const { filesInProgress, completedFiles, currentTransfer } = state

  console.log('ADDING CHUNK', fileUUID, offset, size)

  const buffer = fromBase64Str(chunkBase64)
  const appendedChunk = appendChunk(filesInProgress, fileUUID, size, offset, buffer)
  console.log('APPENDED CHUNK', appendedChunk)

  const updatedCompletedFiles = { ...completedFiles }
  if (appendedChunk.file) {
    updatedCompletedFiles[fileUUID] = appendedChunk.file
  }

  return {
    ...state,
    currentTransfer: currentTransfer + buffer.byteLength,
    filesInProgress: appendedChunk.filesInProgress,
    completedFiles: updatedCompletedFiles,
  }
}

const InitialState: ReceiverState = {
  connectionState: 'connecting',
  currentTransfer: 0,
  filesInProgress: {},
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
  switch (action.type) {
    case START_FILE: {
      const { currentFile } = <StartFileAction>action

      return {
        ...state,
        currentTransfer: 0,
        currentFile,
      }
    }

    case END_FILE: {
      return {
        ...state,
        currentFile: undefined,
        currentTransfer: 0,
      }
    }

    case ADD_CHUNK: {
      const { chunk } = <AddChunkAction>action

      return updateWithChunk(state, chunk)
    }

    case END_TRANSFER: {
      // TODO(vc): Check to see if any outstanding files
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
