import * as React from 'react'
import { connect, DispatchProp } from 'react-redux'

import HandshakeApi from '../../handshake-api'
import { ConnectionState, addHandshake } from '../../state/connection'

type ChatProps = {
  handshake?: HandshakeApi
} & DispatchProp

const Chat: React.SFC<ChatProps> = (props) => {
  const { handshake, dispatch } = props

  const id = 'foobar'
  const url = `http://localhost:8080/recv/${id}`

  const onClick = () => {
    console.log('Starting Handshake')
    const h = new HandshakeApi(`ws://localhost:9090/ws?id=${id}&scope=0`)
    // @ts-ignore
    window.h = h

    const dc = h.rtcConn.createDataChannel('foo')
    dc.onopen = () => console.log('DC OPEN')
    dc.onclose = () => console.log('DC CLOSE')

    // @ts-ignore
    window.dc = dc


    h.startHandshake().then(() => {
      console.log('Handshake Done')
    })


    dispatch(addHandshake(h))
  }

  return (
    <div>
      <h1>Chat</h1>

      { !handshake && <button onClick={onClick}>Start Chat</button> }

      { handshake && (
        <div>
          <h4>Created Offer</h4>
          <ul>
              <a href={url} target="_blank">{ url }</a>
          </ul>
        </div>
      ) }
    </div>
  )
}

const mapStateToProps = (state: {
  connection: ConnectionState
}) => {
  const { handshake } = state.connection

  return { handshake }
}

export default connect(mapStateToProps)(Chat)