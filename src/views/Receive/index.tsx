import * as React from 'react'
import { RouteComponentProps } from 'react-router'
import { Dispatch } from 'redux'
import { connect, DispatchProp } from 'react-redux'

import { receiveFiles } from './file-receiver'
import FileWithPreview from './FileWithPreview'
import loadingComponent from '../loading-component'
import { WebsocketUrl } from '../url-helper'
import HandshakeApi from '../../handshake-api'
import { ReceiverState, FileStore } from '../../state/receiver'
import { FileStub } from '../../state/shared'

type RouteProps = {
  id: string
}

type ReceiveProps = {
  currentFile?: FileStub
  currentTransfer?: FileStore
  files: File[]
} & RouteComponentProps<RouteProps> & DispatchProp

const Receive: React.SFC<ReceiveProps> = (props) => {
  const { currentFile, currentTransfer, files } = props
  const percent = currentTransfer && currentFile && (100.0 * currentTransfer.bytesReceived / currentFile.size)

  return (
    <div>
      <h1>Receive Share { window.VERSION }</h1>

      { currentTransfer && currentFile && (
        <div>
          <h3>Downloading { currentFile.name }</h3>

          <p>{ currentTransfer.bytesReceived } / { currentFile.size } ({ percent }%)</p>
        </div>
      ) }

      <div>
        <h3>Files Completed</h3>

        <ul>
          { files.map((file) => (
            <FileWithPreview file={file} />
          )) }
        </ul>
      </div>
    </div>
  )
}

const loader = (dispatch: Dispatch, props: ReceiveProps): Promise<any> => {
  const {
    match: { params: { id } },
  } = props

  const handshakeApi = new HandshakeApi(WebsocketUrl, id, 'answer')
  handshakeApi.onData = receiveFiles(dispatch)

  // @ts-ignore
  window.h = handshakeApi

  return handshakeApi.receiveHandshake()
}

const mapStateToProps = (state: {
  receiver: ReceiverState
}) => {
  const { currentFile, currentTransfer, completedFiles } = state.receiver

  const keys = Object.keys(completedFiles)
  const files = keys.map((key) => completedFiles[key])

  return {
    currentFile,
    currentTransfer,
    files,
  }
}

export default connect(mapStateToProps)(loadingComponent(loader, Receive))