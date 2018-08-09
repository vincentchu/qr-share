import * as React from 'react'
import { RouteComponentProps } from 'react-router'
import { Dispatch } from 'redux'
import { connect, DispatchProp } from 'react-redux'

import { receiveFiles } from './file-receiver'
import loadingComponent from '../loading-component'
import HandshakeApi from '../../handshake-api'

type SDPRouteProps = {
  id: string
}

type ReceiveProps = {
} & RouteComponentProps<SDPRouteProps> & DispatchProp

const Receive: React.SFC<ReceiveProps> = (props) => {
  console.log('PROPS', props)
  return (
    <div>
      <h1>Receive Chat</h1>
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

  // @ts-ignore
  window.h = h

  return h.receiveHandshake()
}

// const mapStateToProps = (state: {
//   connection: ConnectionState
// }) => ({ handshake: state.connection.handshake })

export default connect()(loadingComponent(loader, Receive))