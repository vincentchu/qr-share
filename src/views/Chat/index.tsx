import * as React from 'react'
import { connect } from 'react-redux'

import { ConnectionState } from '../../state/connection'

type ChatProps = {
}

const Chat: React.SFC<ChatProps> = (props) => {
  return (
    <div>
      <h1>Chat</h1>
    </div>
  )
}

const mapStateToProps = (state: {
  connection: ConnectionState
}) => {
  return {
  }
}

export default connect(mapStateToProps)(Chat)