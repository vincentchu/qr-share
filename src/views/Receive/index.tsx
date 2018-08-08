import * as React from 'react'
import { RouteComponentProps } from 'react-router'
import { Dispatch } from 'redux'
import { connect, DispatchProp } from 'react-redux'

import loadingComponent from '../loading-component'
import HandshakeApi from '../../handshake-api'
import { ConnectionState, addHandshake } from '../../state/connection'

type SDPRouteProps = {
  id: string
}

type ReceiveProps = {
  connection: RTCPeerConnection
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
    connection,
    match: { params: { id } },
  } = props

  const url = `ws://localhost:9090/ws?id=${id}&scope=1`

  const h = new HandshakeApi(url)
  // @ts-ignore
  window.h = h

  return h.receiveHandshake().then(() => dispatch(addHandshake(h)))
}

const mapStateToProps = (state: {
  connection: ConnectionState
}) => ({ handshake: state.connection.handshake })

export default connect(mapStateToProps)(loadingComponent(loader, Receive))