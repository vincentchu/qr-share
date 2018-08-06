import * as React from 'react'
import { RouteComponentProps } from 'react-router'
import { Dispatch } from 'redux'
import { connect, DispatchProp } from 'react-redux'

import loadingComponent from '../loading-component'
import { ConnectionState, addAnswer } from '../../state/connection'
import { decodeOffer, receiveHandshake } from '../../conn-utils'

type SDPRouteProps = {
  sdp: string
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
    match: { params: { sdp } },
  } = props
  const offer = decodeOffer(sdp)

  return receiveHandshake(connection, offer).then((answer) => dispatch(addAnswer(answer)))
}

const mapStateToProps = (state: {
  connection: ConnectionState
}) => ({ connection: state.connection.connection })

export default connect(mapStateToProps)(loadingComponent(loader, Receive))