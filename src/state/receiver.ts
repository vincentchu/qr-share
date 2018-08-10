import { Action, ActionCreator, Reducer, AnyAction } from 'redux'
import { FileStub } from './shared'

export type FileStore = {
  bytesReceived: number
  buffer: ArrayBuffer[]
}

const keyFor = (stub: FileStub): string => [ stub.name, stub.size, stub.lastModified ].join('/')

const emptyFileStore = (metadata: FileStub): FileStore => ({
  bytesReceived: 0,
  buffer: [],
})

const updateTransfer = (currentTransfer: FileStore, chunk: ArrayBuffer): FileStore => ({
  bytesReceived: currentTransfer.bytesReceived + chunk.byteLength,
  buffer: currentTransfer.buffer.concat([ chunk ])
})

const completedFile = (currentFile: FileStub, currentTransfer: FileStore): File => {
  if (currentFile.size !== currentTransfer.bytesReceived) {
    throw new Error(`Received bytes note equal to file size ${currentTransfer.bytesReceived} != ${currentFile.size}`)
  }

  const blob = new Blob(currentTransfer.buffer)
  const props = {
    type: currentFile.type,
    lastModified: currentFile.lastModified,

  }

  return new File([ blob ], currentFile.name, props)
}

export type ReceiverState = {
  currentFile?: FileStub
  currentTransfer?: FileStore
  completedFiles: {
    [ key: string ]: File
  }
}

const InitialState: ReceiverState = {
  completedFiles: {}
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
      const { chunk } = <AddChunkAction>action

      const { currentTransfer } = state
      const updatedTransfer = updateTransfer(currentTransfer, chunk)

      return {
        ...state,
        currentTransfer: updatedTransfer,
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
