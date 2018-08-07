import * as React from 'react'
import { RouteComponentProps } from 'react-router'
import { Dispatch } from 'redux'
import { connect, DispatchProp } from 'react-redux'

import loadingComponent from '../loading-component'
import { ConnectionState, addAnswer } from '../../state/connection'
import { decodeOffer, receiveHandshake } from '../../conn-utils'

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

  return receiveHandshake(connection, id).then((answer) => dispatch(addAnswer(answer)))
}

const mapStateToProps = (state: {
  connection: ConnectionState
}) => ({ connection: state.connection.connection })

export default connect(mapStateToProps)(loadingComponent(loader, Receive))