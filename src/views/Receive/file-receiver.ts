import { Dispatch } from 'redux'

import { startFile, endFile, addChunk, changeConnectionState } from '../../state/receiver'
import HandshakeApi, { DataSender } from '../../handshake-api'

type ActionMessage = {
  action: string
  name?: string
  type?: string
  size?: number
  hasPreview?: boolean
  lastModified?: number
}

export const receiveFiles = (dispatch: Dispatch, handshakeApi: HandshakeApi): DataSender => (data: string | ArrayBuffer) => {
  dispatch(changeConnectionState(handshakeApi.connectionState))

  if (typeof data === 'string') {
    const mesg: ActionMessage = JSON.parse(data)
    switch (mesg.action) {
      case 'start':
        dispatch((startFile(mesg)))
        break

      case 'end':
        dispatch(endFile())
        break
    }
  } else {
    dispatch(addChunk(data))
  }

  return Promise.resolve()
}