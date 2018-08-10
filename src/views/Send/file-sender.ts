import { ImageFile } from 'react-dropzone'
import { Dispatch } from 'redux'

import { changeDataReady } from '../../state/uploader'

const ChunkSize = 16384

export const DataChannelName = 'files'

export const sendFiles = (files: ImageFile[], peerConnection: RTCPeerConnection, dispatch: Dispatch) => {
  const data = peerConnection.createDataChannel(DataChannelName)
  data.binaryType = 'arraybuffer'
  data.onclose = () => dispatch(changeDataReady('not-ready'))
  data.onopen = () => {
    dispatch(changeDataReady('ready'))

    const sender = (idx: number): Promise<any> => {
      if (idx < files.length ) {
        return sendFile(files[idx], data, dispatch).then(() => sender(idx + 1))
      } else {
        return Promise.resolve(1)
      }
    }

    sender(0)
  }

  peerConnection.ondatachannel = (evt) => console.log('sendFiles: Received data channel', evt)
}

const streamChunk = (file: ImageFile, offset: number, data: RTCDataChannel, dispatch: Dispatch): Promise<any> => {
  return new Promise((resolve) => {
    const blob = file.slice(offset, offset + ChunkSize)
    const reader = new FileReader()
    reader.onload = () => {
      const arrBuff: ArrayBuffer = reader.result
      data.send(arrBuff)

      resolve()
    }

    reader.readAsArrayBuffer(blob)
  })
}

const sendFile = (file: ImageFile, data: RTCDataChannel, dispatch: Dispatch): Promise<any> => {
  console.log('sendFile: starting stream', file.name, file.size)
  data.send(JSON.stringify({
    action: 'start',
    name: file.name,
    type: file.type,
    size: file.size,
    hasPreview: !!file.preview,
    lastModified: file.lastModified,
  }))

  const streamer = (offset: number): Promise<any> => {
    if (offset > file.size) {
      console.log('sendFile: finished streaming')
      return Promise.resolve()
    } else {
      console.log('sendFile: sending next chunk', offset)
      return streamChunk(file, offset, data, dispatch).then(() => streamer(offset + ChunkSize))
    }
  }

  return streamer(0).then(() => {
    console.log('sendFile: Finished sending', file.name)
    data.send(JSON.stringify({ action: 'end' }))
  })
}
