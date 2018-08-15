import { ImageFile } from 'react-dropzone'
import { Dispatch } from 'redux'

import { changeDataReady } from '../../state/uploader'
import HandshakeApi from '../../handshake-api'

const ChunkSize = 16384

export const DataChannelName = 'files'

export const sendFiles = (files: ImageFile[], handshakeApi: HandshakeApi, dispatch: Dispatch) => {
  const sender = (idx: number): Promise<any> => {
    if (idx < files.length ) {
      return sendFile(files[idx], handshakeApi, dispatch).then(() => sender(idx + 1))
    } else {
      return Promise.resolve(1)
    }
  }

  sender(0)
}

const streamChunk = (file: ImageFile, offset: number, handshakeApi: HandshakeApi, dispatch: Dispatch): Promise<any> => {
  return new Promise((resolve) => {
    const blob = file.slice(offset, offset + ChunkSize)
    const reader = new FileReader()
    reader.onload = () => {
      const arrBuff: ArrayBuffer = reader.result
      handshakeApi.send(arrBuff).then(resolve)
    }

    reader.readAsArrayBuffer(blob)
  })
}

const sendFile = (file: ImageFile, handshakeApi: HandshakeApi, dispatch: Dispatch): Promise<any> => {
  console.log('sendFile: starting stream', file.name, file.size)
  return handshakeApi.send(JSON.stringify({
    action: 'start',
    name: file.name,
    type: file.type,
    size: file.size,
    hasPreview: !!file.preview,
    lastModified: file.lastModified,
  })).then(() => {
    const streamer = (offset: number): Promise<any> => {
      if (offset > file.size) {
        console.log('sendFile: finished streaming')
        return Promise.resolve()
      } else {
        console.log('sendFile: sending next chunk', offset)
        return streamChunk(file, offset, handshakeApi, dispatch).then(() => streamer(offset + ChunkSize))
      }
    }

    return streamer(0).then(() => {
      console.log('sendFile: Finished sending', file.name)
      handshakeApi.send(JSON.stringify({ action: 'end' }))
    })
  })
}
