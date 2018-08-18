import { ImageFile } from 'react-dropzone'
import { Dispatch } from 'redux'
import * as uuid from 'uuid/v1'

import { trackOnDrop, trackFileSize, trackConnectionMethod } from '../../analytics'
import { toBase64Str } from '../../crypto-utils'
import HandshakeApi from '../../handshake-api'
import { changeDataReady, changeCurrentFile, changeBytesTransferred } from '../../state/uploader'

// const ChunkSize = 16384
const ChunkSize = 10000

export const sendFiles = (files: ImageFile[], handshakeApi: HandshakeApi, dispatch: Dispatch) => {
  dispatch(changeDataReady(handshakeApi.connectionState))
  trackConnectionMethod(handshakeApi.connectionState, handshakeApi.scope)
  trackOnDrop(handshakeApi.scope, files.length)

  const sender = (idx: number): Promise<any> => {
    if (idx < files.length ) {
      return sendFile(files[idx], handshakeApi, dispatch).then(() => sender(idx + 1))
    }

    return Promise.resolve(1)
  }

  sender(0).then(() => {
    dispatch(changeCurrentFile())
    handshakeApi.send(JSON.stringify({ action: 'end-transfer' }))
  })
}

const streamChunk = (file: ImageFile, fileUUID: string, offset: number, handshakeApi: HandshakeApi, dispatch: Dispatch): Promise<any> => {
  return new Promise((resolve) => {
    const blob = file.slice(offset, offset + ChunkSize)
    dispatch(changeBytesTransferred(offset))

    const reader = new FileReader()
    reader.onload = () => {
      const arrBuff = <ArrayBuffer>reader.result
      const chunk = JSON.stringify({
        action: 'chunk',
        chunk: toBase64Str(arrBuff),
        offset,
        fileUUID,
      })

      handshakeApi.send(chunk).then(resolve)
    }

    reader.readAsArrayBuffer(blob)
  })
}

const sendFile = (file: ImageFile, handshakeApi: HandshakeApi, dispatch: Dispatch): Promise<any> => {
  console.log('sendFile: starting stream', file.name, file.size)
  dispatch(changeCurrentFile(file))
  trackFileSize(handshakeApi.scope, file.size)

  const fileUUID = uuid()
  return handshakeApi.send(JSON.stringify({
    action: 'start',
    name: file.name,
    type: file.type,
    size: file.size,
    hasPreview: !!file.preview,
    lastModified: file.lastModified,
    fileUUID,
  })).then(() => {
    const streamer = (offset: number): Promise<any> => {
      if (offset > file.size) {
        console.log('sendFile: finished streaming')
        return Promise.resolve()
      } else {
        console.log('sendFile: sending next chunk', offset)
        return streamChunk(file, fileUUID, offset, handshakeApi, dispatch).then(() => streamer(offset + ChunkSize))
      }
    }

    return streamer(0).then(() => {
      console.log('sendFile: Finished sending', file.name)
      handshakeApi.send(JSON.stringify({ action: 'end', fileUUID }))
    })
  })
}
