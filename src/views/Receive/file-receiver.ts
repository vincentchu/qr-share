import { Dispatch } from 'redux'

import { DataChannelName } from '../Chat/file-sender'
import { startFile, endFile, addChunk } from '../../state/receiver'

type ActionMessage = {
  action: string
  name?: string
  type?: string
  size?: number
  hasPreview?: boolean
  lastModified?: number
}


export const receiveFiles = (peerConnection: RTCPeerConnection, dispatch: Dispatch) => {
  peerConnection.ondatachannel = (evt) => {
    const { channel } = evt

    if (channel.label === DataChannelName) {
      channel.onmessage = ({ data }) => {
        if (typeof data === 'string') {
          const mesg: ActionMessage = JSON.parse(data)
          switch (mesg.action) {
            case 'start':
              return dispatch((startFile(mesg)))

            case 'end':
              return dispatch(endFile())
          }
        } else {
          dispatch(addChunk(data))
        }
      }
    }
  }
}