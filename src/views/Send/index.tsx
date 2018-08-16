import * as React from 'react'
import { connect, DispatchProp } from 'react-redux'
import Dropzone, { ImageFile } from 'react-dropzone'
import * as uuid from 'uuid/v1'
import * as QRCode from 'qrcode.react'

import FilePicker from './FilePicker'
import { sendFiles } from './file-sender'
import Footer from '../Footer'
import { urlForReceive, WebsocketUrl } from '../url-helper'
import HandshakeApi, { ConnectionState } from '../../handshake-api'
import { UploaderState, addFiles, updateHandshakeData } from '../../state/uploader'

type SendProps = {
  id?: string
  connectionState?: ConnectionState
  files: ImageFile[]
} & DispatchProp

const Send: React.SFC<SendProps> = (props) => {
  const { id, files, dispatch, connectionState } = props
  const url = id && urlForReceive(id)

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

      <Footer />
    </div>
  )
}

const mapStateToProps = (state: {
  uploader: UploaderState,
}) => {
  const { files, handshakeApi, connectionState } = state.uploader
  const id = handshakeApi && handshakeApi.id

  return { id, files, connectionState }
}

export default connect(mapStateToProps)(Send)