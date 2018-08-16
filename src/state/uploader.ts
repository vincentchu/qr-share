import { Action, ActionCreator, Reducer, AnyAction } from 'redux'
import { ImageFile } from 'react-dropzone'

import { FileStub, FileTransfer } from './shared'
import HandshakeApi, { ConnectionState } from '../handshake-api'

export type UploaderState = {
  files: ImageFile[]
  connectionState: ConnectionState
  handshakeApi?: HandshakeApi
  currentFile?: FileStub
  currentTransfer?: FileTransfer
  transferredFiles: Set<string>
}

const InitialState: UploaderState = {
  files: [],
  connectionState: 'connecting',
  transferredFiles: new Set(),
}

const ADD_FILES = 'state-uploader/ADD_FILES'
const UPDATE_HANDSHAKE_DATA = 'state-uploader/UPDATE_DATA_CHANNEL'
const CHANGE_DATA_READY = 'state-uploader/CHANGE_DATA_READY'
const CHANGE_CURRENT_FILE = 'state-uploader/CHANGE_CURRENT_FILE'
const CHANGE_BYTES_XFER = 'state-uploader/CHANGE_BYTES_XFER'

type AddFiles = {
  files: ImageFile[]
} & Action<string>

type UpdateHandshake = {
  handshakeApi: HandshakeApi
} & Action<string>

type ChangeDataReady = {
  connectionState: ConnectionState
} & Action<string>

type ChangeCurrentFile = {
  currentFile?: FileStub
} & Action<string>

type ChangeBytesTransferred = {
  bytesTransferred: number
} & Action<string>

export const reducer: Reducer<UploaderState, AnyAction> = (
  state: UploaderState = InitialState,
  action: AddFiles | UpdateHandshake | ChangeDataReady | ChangeCurrentFile | ChangeBytesTransferred
) => {
  switch (action.type) {
    case ADD_FILES: {
      const { files } = <AddFiles>action

      return {
        ...state,
        files,
      }
    }

    case UPDATE_HANDSHAKE_DATA: {
      const { handshakeApi } = <UpdateHandshake>action

      return {
        ...state,
        handshakeApi,
      }
    }

    case CHANGE_DATA_READY: {
      const { connectionState } = <ChangeDataReady>action

      return {
        ...state,
        connectionState,
      }
    }

    case CHANGE_CURRENT_FILE: {
      const { currentFile } = <ChangeCurrentFile>action
      const { transferredFiles } = state

      currentFile && transferredFiles.add(currentFile.name)

      return {
        ...state,
        currentFile,
        transferredFiles,
      }
    }

    case CHANGE_BYTES_XFER: {
      const { bytesTransferred } = <ChangeBytesTransferred>action

      return {
        ...state,
        currentTransfer: {
          buffer: [],
          bytesTransferred,
        },
      }
    }

    default:
      return state
  }
}

export const addFiles: ActionCreator<AddFiles> = (files: ImageFile[]) => ({
  type: ADD_FILES,
  files,
})

export const updateHandshakeData: ActionCreator<UpdateHandshake> = (handshakeApi: HandshakeApi) => ({
  type: UPDATE_HANDSHAKE_DATA,
  handshakeApi,
})

export const changeDataReady: ActionCreator<ChangeDataReady> = (connectionState: ConnectionState) => ({
  type: CHANGE_DATA_READY,
  connectionState,
})

export const changeCurrentFile: ActionCreator<ChangeCurrentFile> = (currentFile: FileStub): ChangeCurrentFile => ({
  type: CHANGE_CURRENT_FILE,
  currentFile
})

export const changeBytesTransferred: ActionCreator<ChangeBytesTransferred> = (bytesTransferred: number): ChangeBytesTransferred => ({
  type: CHANGE_BYTES_XFER,
  bytesTransferred,
})