import * as React from 'react'
import { connect, DispatchProp } from 'react-redux'
import { ImageFile } from 'react-dropzone'
import * as uuid from 'uuid/v1'

import FilePicker from './FilePicker'
import Upload from './Upload'
import { sendFiles } from './file-sender'
import Footer from '../Footer'
import { WebsocketUrl } from '../url-helper'
import HandshakeApi, { ConnectionState } from '../../handshake-api'
import { UploaderState, addFiles, updateHandshakeData } from '../../state/uploader'
import { FileStub, FileTransfer } from '../../state/shared'

type SendProps = {
  id?: string
  connectionState?: ConnectionState
  currentFile?: FileStub
  currentTransfer?: FileTransfer
  files: ImageFile[]
} & DispatchProp

const Send: React.SFC<SendProps> = (props) => {
  const { id, files, dispatch, connectionState, currentFile, currentTransfer } = props

  const onDrop = (files: ImageFile[]) => {
    const handshakeApi = new HandshakeApi(WebsocketUrl, uuid(), 'offer')

    // @ts-ignore
    window.h = handshakeApi

    dispatch(addFiles(files))
    dispatch(updateHandshakeData(handshakeApi))

    handshakeApi.startHandshake().then(() => {
      console.log('Handshake Done!')
      sendFiles(files, handshakeApi, dispatch)
    })
  }

  return (
    <div>
      { !id && <FilePicker onDrop={onDrop} /> }

      { id && <Upload
        id={id} files={files} connectionState={connectionState}
        currentFile={currentFile} currentTransfer={currentTransfer}
      /> }

      <Footer />
    </div>
  )
}

const mapStateToProps = (state: {
  uploader: UploaderState,
}) => {
  const { files, handshakeApi, connectionState, currentFile, currentTransfer } = state.uploader
  const id = handshakeApi && handshakeApi.id

  return {
    id,
    files,
    connectionState,
    currentFile,
    currentTransfer,
  }
}

export default connect(mapStateToProps)(Send)