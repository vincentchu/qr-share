import * as React from 'react'
import { RouteComponentProps } from 'react-router'
import { Dispatch } from 'redux'
import { connect, DispatchProp } from 'react-redux'

import { receiveFiles } from './file-receiver'
import loadingComponent from '../loading-component'
import HandshakeApi from '../../handshake-api'
import { ReceiverState, FileStore, FileStub } from '../../state/receiver'

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
      <h1>Receive Share</h1>

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
            <li key={file.name}>
              { file.name }
            </li>
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

  const url = 'ws://localhost:9090/ws'
  const h = new HandshakeApi(url, id, 'answer')
  receiveFiles(h.peerConnection, dispatch)

  return h.receiveHandshake()
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