import { Action, ActionCreator, Reducer, AnyAction, ActionCreatorsMapObject } from 'redux'
import { ImageFile } from 'react-dropzone'

import HandshakeApi from '../handshake-api'

export type ReadyState = 'not-ready' | 'ready'

export type UploaderState = {
  files: ImageFile[]
  dataChannelState: ReadyState
  handshakeState: ReadyState
  dataChannel?: RTCDataChannel
  handshakeApi?: HandshakeApi
}

const InitialState: UploaderState = {
  files: [],
  dataChannelState: 'not-ready',
  handshakeState: 'not-ready',
}

const ADD_FILES = 'state-uploader/ADD_FILES'
const UPDATE_HANDSHAKE_DATA = 'state-uploader/UPDATE_DATA_CHANNEL'
const CHANGE_DATA_READY = 'state-uploader/CHANGE_DATA_READY'

type AddFiles = {
  files: ImageFile[]
} & Action<string>

type UpdateHandshakeData = {
  dataChannel: RTCDataChannel,
  handshakeApi: HandshakeApi
} & Action<string>

type ChangeDataReady = {
  dataChannelState: ReadyState
} & Action<string>

export const reducer: Reducer<UploaderState, AnyAction> = (
  state: UploaderState = InitialState,
  action: AddFiles | UpdateHandshakeData | ChangeDataReady
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
      const { dataChannel, handshakeApi } = <UpdateHandshakeData>action

      return {
        ...state,
        dataChannel,
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

export const updateHandshakeData: ActionCreator<UpdateHandshakeData> = (handshakeApi: HandshakeApi, dataChannel: RTCDataChannel) => ({
  type: UPDATE_HANDSHAKE_DATA,
  handshakeApi,
  dataChannel,
})

export const changeDataReady: ActionCreator<ChangeDataReady> = (dataChannelState: ReadyState) => ({
  type: CHANGE_DATA_READY,
  dataChannelState,
})