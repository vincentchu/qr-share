import { Action, ActionCreator, Reducer, AnyAction } from 'redux'
import { ImageFile } from 'react-dropzone'

import HandshakeApi from '../handshake-api'

export type ReadyState = 'not-ready' | 'ready'

export type UploaderState = {
  files: ImageFile[]
  dataChannelState: ReadyState
  handshakeApi?: HandshakeApi
}

const InitialState: UploaderState = {
  files: [],
  dataChannelState: 'not-ready',
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
  dataChannelState: ReadyState
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
      const { dataChannelState } = <ChangeDataReady>action

      return {
        ...state,
        dataChannelState,
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

export const changeDataReady: ActionCreator<ChangeDataReady> = (dataChannelState: ReadyState) => ({
  type: CHANGE_DATA_READY,
  dataChannelState,
})