import * as React from 'react'
import { connect, DispatchProp } from 'react-redux'

import { ConnectionState, addOffer } from '../../state/connection'

type ChatProps = {
  connection?: RTCPeerConnection
  offer?: RTCSessionDescriptionInit
} & DispatchProp

const Chat: React.SFC<ChatProps> = (props) => {
  const { offer, connection, dispatch } = props
  const onClick = () => {
    console.log('Creating offer')

    connection.createOffer().then((createdOffer) => dispatch(addOffer(createdOffer)))
  }

  return (
    <div>
      <h1>Chat</h1>

      { !offer && <button onClick={onClick}>Start Chat</button> }

      { offer && (
        <div>
          <h4>Created Offer</h4>
          <ul>
            <li>SDP: { offer.sdp }</li>
            <li>Type: { offer.type }</li>
          </ul>
        </div>
      ) }
    </div>
  )
}

const mapStateToProps = (state: {
  connection: ConnectionState
}) => {
  const { connection, offer } = state.connection

  return {
    connection,
    offer,
  }
}

export default connect(mapStateToProps)(Chat)