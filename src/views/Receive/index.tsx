import * as React from 'react'
import { RouteComponentProps } from 'react-router'
import { Dispatch } from 'redux'
import { connect, DispatchProp } from 'react-redux'

import { receiveFiles } from './file-receiver'
import loadingComponent from '../loading-component'
import HandshakeApi from '../../handshake-api'

type RouteProps = {
  id: string
}

type ReceiveProps = {
} & RouteComponentProps<RouteProps> & DispatchProp

const Receive: React.SFC<ReceiveProps> = (props) => {
  return (
    <div>
      <h1>Receive Share</h1>
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

export default connect()(loadingComponent(loader, Receive))