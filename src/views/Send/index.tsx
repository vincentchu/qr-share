import * as React from 'react'
import { connect, DispatchProp } from 'react-redux'
import { ImageFile } from 'react-dropzone'
import * as uuid from 'uuid/v1'

import FilePicker from './FilePicker'
import Upload from './Upload'
import { sendFiles } from './file-sender'
import Footer from '../Footer'
import { WebsocketUrl } from '../url-helper'
import { generateKey, exportKey } from '../../crypto-utils'
import HandshakeApi, { ConnectionState } from '../../handshake-api'
import { UploaderState, addFiles, updateHandshakeData } from '../../state/uploader'
import { FileStub, FileTransfer } from '../../state/shared'

type SendProps = {
  id?: string
  keyIV?: string
  connectionState?: ConnectionState
  currentFile?: FileStub
  currentTransfer?: FileTransfer
  transferredFiles: Set<string>
  files: ImageFile[]
} & DispatchProp

const Send: React.SFC<SendProps> = (props) => {
  const {
    id, keyIV, files, dispatch, connectionState,
    currentFile, currentTransfer, transferredFiles,
  } = props

  const onDrop = (files: ImageFile[]) => {
    const handshakeApi = new HandshakeApi(WebsocketUrl, uuid(), 'offer')

    // @ts-ignore
    window.h = handshakeApi

    dispatch(addFiles(files))
    generateKey().then((keyIV) => {
      return exportKey(keyIV).then((exportedKeyIV) => {
        handshakeApi.keyIV = keyIV
        handshakeApi.exportedKeyIV = exportedKeyIV
        dispatch(updateHandshakeData(handshakeApi))

        return handshakeApi.startHandshake().then(() => {
          console.log('Handshake Done!')
          sendFiles(files, handshakeApi, dispatch)
        })
      })
    })
  }

  return (
    <div>
      { !id && <FilePicker onDrop={onDrop} /> }

      { (id && keyIV) && <Upload
        id={id} files={files} connectionState={connectionState} transferredFiles={transferredFiles}
        currentFile={currentFile} currentTransfer={currentTransfer} keyIV={keyIV}
      /> }

      <Footer />
    </div>
  )
}

const mapStateToProps = (state: {
  uploader: UploaderState,
}) => {
  const {
    files, handshakeApi, connectionState,
    currentFile, currentTransfer, transferredFiles,
  } = state.uploader

  const id = handshakeApi && handshakeApi.id
  const keyIV = handshakeApi && handshakeApi.exportedKeyIV

  return {
    id,
    keyIV,
    files,
    connectionState,
    currentFile,
    currentTransfer,
    transferredFiles,
  }
}

export default connect(mapStateToProps)(Send)