import * as React from 'react'
import classnames from 'classnames'

import { ConnectionState } from '../handshake-api'
import { FileStub, FileTransfer } from '../state/shared'

type ProgressProps = {
  connectionState: ConnectionState
  currentFile?: FileStub
  currentTransfer?: FileTransfer
}

const Progress: React.SFC<ProgressProps> = (props) => {
  const { connectionState, currentFile, currentTransfer } = props

  const size = currentFile && currentFile.size
  const current = currentTransfer && currentTransfer.bytesTransferred
  const progress = currentFile && currentTransfer && Math.ceil(100 * current / size)
  const width = `${progress}%`

  let connState = ''
  let connStyle = 'text-success'
  switch (connectionState) {
    case 'connecting':
      connState = 'Waiting for connection'
      connStyle = 'text-warning'
      break

    case 'webrtc':
      connState = 'Connected via WebRTC'
      break

    case 'websocket':
      connState = 'Connected via Websocket'
      break
  }

  return (
    <div className="progress-module">
      <div className={classnames(connStyle, 'font-weight-light')}>
        { connState }
      </div>

      { currentFile && currentTransfer && (
        <div className="current-file row justify-content-center text-muted font-weight-light">
          <div className="col-8">
            { currentFile.name }
            <div className="bar progress">
              <div className="progress-bar" style={{ width }} />
            </div>
          </div>
        </div>
      ) }
    </div>
  )
}

export default Progress