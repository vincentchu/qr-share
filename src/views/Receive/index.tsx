import * as React from 'react'
import { RouteComponentProps } from 'react-router'
import { Dispatch } from 'redux'
import { isNil } from 'ramda'
import { connect, DispatchProp } from 'react-redux'

import { receiveFiles } from './file-receiver'
import Gallery from './Gallery'
import loadingComponent from '../loading-component'
import Progress from '../Progress'
import Footer from '../Footer'
import StepBlock from '../StepBlock'
import { WebsocketUrl } from '../url-helper'
import { importKey } from '../../crypto-utils'
import HandshakeApi, { ConnectionState } from '../../handshake-api'
import { ReceiverState } from '../../state/receiver'
import { FileStub, FileTransfer } from '../../state/shared'
import { trackConnectionMethod } from '../../analytics';

type RouteProps = {
  id: string
}

type ReceiveProps = {
  connectionState: ConnectionState
  currentFile?: FileStub
  currentTransfer: number
  files: File[]
} & RouteComponentProps<RouteProps> & DispatchProp

const Receive: React.SFC<ReceiveProps> = (props) => {
  const { connectionState, currentFile, currentTransfer, files } = props

  const isDone = isNil(currentFile) && files.length > 0
  const header = isDone ? 'Transfer Completed' : 'Receiving Files'
  const xfer: FileTransfer = { bytesTransferred: currentTransfer, buffer: [] }

  return (
    <div className="row justify-content-center">
      <div className="block text-center">
        { !isDone && <Progress
          connectionState={connectionState}
          currentFile={currentFile} currentTransfer={xfer}
        /> }
      </div>

      <Gallery files={files} />

      <StepBlock header={header} subHeader="" />

      <Footer />
    </div>
  )
}

const loader = (dispatch: Dispatch, props: ReceiveProps): Promise<any> => {
  const {
    match: { params: { id } },
    location: { hash },
  } = props

  const handshakeApi = new HandshakeApi(WebsocketUrl, id, 'answer')
  handshakeApi.onData = receiveFiles(dispatch, handshakeApi)

  // @ts-ignore
  window.h = handshakeApi

  importKey(hash.slice(1)).then((keyIV) => handshakeApi.keyIV = keyIV)
  setTimeout(() => trackConnectionMethod(handshakeApi.connectionState, handshakeApi.scope), 2000)

  return handshakeApi.receiveHandshake()
}

const mapStateToProps = (
  state: { receiver: ReceiverState },
) => {
  const { currentFile, currentTransfer, completedFiles, connectionState } = state.receiver

  const keys = Object.keys(completedFiles)
  const files = keys.map((key) => completedFiles[key])

  return {
    connectionState,
    currentFile,
    currentTransfer,
    files,
  }
}

export default connect(mapStateToProps)(loadingComponent(loader, Receive))