import { Dispatch } from 'redux'

import { trackFileSize } from '../../analytics'
import HandshakeApi, { DataSender } from '../../handshake-api'
import { startFile, endFile, endTransfer, addChunk, changeConnectionState } from '../../state/receiver'

type ActionMessage = {
  action: string
  name?: string
  type?: string
  size?: number
  hasPreview?: boolean
  lastModified?: number
  fileUUID?: string
  offset?: number
  chunk?: string
}

export const receiveFiles = (dispatch: Dispatch, handshakeApi: HandshakeApi): DataSender => (data: string | ArrayBuffer) => {
  dispatch(changeConnectionState(handshakeApi.connectionState))

  if (typeof data === 'string') {
    const mesg: ActionMessage = JSON.parse(data)
    switch (mesg.action) {
      case 'start':
        dispatch((startFile(mesg)))
        trackFileSize(handshakeApi.scope, mesg.size)
        break

      case 'chunk':
        dispatch(addChunk({
          fileUUID: mesg.fileUUID,
          offset: mesg.offset,
          chunkBase64: mesg.chunk,
          size: mesg.size,
        }))

      case 'end':
        dispatch(endFile(mesg.fileUUID))
        break

      case 'end-transfer':
        // Safari is kind of crazy with race conditions, so give 1s for everything to settle down
        // before trying to reassemble files
        setTimeout(() => dispatch(endTransfer()), 1000)
        break
    }
  } else {
    throw new Error('No raw data should be transferred')
  }

  return Promise.resolve()
}