import { Dispatch } from 'redux'

import { DataChannelName } from '../Send/file-sender'
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
  const foo = peerConnection.createDataChannel('foo')
  foo.onopen = () => console.log('Foo is open')
  foo.onclose = () => console.log('Foo is closed')

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