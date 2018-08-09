import { ImageFile } from 'react-dropzone'
import { Dispatch } from 'redux'

import { changeDataReady } from '../../state/uploader'

const ChunkSize = 16384

export const sendFiles = (files: ImageFile[], peerConnection: RTCPeerConnection, dispatch: Dispatch) => {
  const data = peerConnection.createDataChannel('foo')
  data.binaryType = 'arraybuffer'
  data.onclose = () => dispatch(changeDataReady('not-ready'))
  data.onopen = () => {
    dispatch(changeDataReady('ready'))

    files.forEach((file) => sendFile(file, data, dispatch))
  }
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

const sendFile = (file: ImageFile, data: RTCDataChannel, dispatch: Dispatch) => {
  data.send(JSON.stringify({
    action: 'start',
    name: file.name,
    type: file.type,
    size: file.size,
    hasPreview: !!file.preview,
    lastModified: file.lastModified,
  }))

  console.log('STREAMING FILE', file.size, file.name)
  const streamer = (offset: number): Promise<any> => {
    if (offset > file.size) {
      console.log('OFFSET reached', offset, file.size)
      return Promise.resolve()
    } else {
      console.log('RECURSING', offset)
      return streamChunk(file, offset, data, dispatch).then(() => streamer(offset + ChunkSize))
    }
  }
  streamer(0).then(() => {
    console.log('STRAM DONE')
    data.send(JSON.stringify({ action: 'end' }))
  })
}
