import { Action, ActionCreator, Reducer, AnyAction } from 'redux'
import { ImageFile } from 'react-dropzone'

import { FileStub } from './shared'
import HandshakeApi, { ConnectionState } from '../handshake-api'

export type UploaderState = {
  files: ImageFile[]
  connectionState: ConnectionState
  handshakeApi?: HandshakeApi
  currentFile?: FileStub
}

const InitialState: UploaderState = {
  files: [],
  connectionState: 'connecting',
}

const ADD_FILES = 'state-uploader/ADD_FILES'
const UPDATE_HANDSHAKE_DATA = 'state-uploader/UPDATE_DATA_CHANNEL'
const CHANGE_DATA_READY = 'state-uploader/CHANGE_DATA_READY'

type AddFiles = {
  files: ImageFile[]
} & Action<string>

type UpdateHandshake = {
  handshakeApi: HandshakeApi
} & Action<string>

type ChangeDataReady = {
  connectionState: ConnectionState
} & Action<string>

export const reducer: Reducer<UploaderState, AnyAction> = (
  state: UploaderState = InitialState,
  action: AddFiles | UpdateHandshake | ChangeDataReady
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