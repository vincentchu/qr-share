import * as React from 'react'
import { connect, DispatchProp } from 'react-redux'
import Dropzone, { ImageFile } from 'react-dropzone'
import * as uuid from 'uuid/v1'

import HandshakeApi from '../../handshake-api'
import { UploaderState, addFiles, updateHandshakeData, changeDataReady } from '../../state/uploader'

type ChatProps = {
  id?: string
  files: ImageFile[]
} & DispatchProp

const Chat: React.SFC<ChatProps> = (props) => {
  const { id, files, dispatch } = props
  console.log("HERE", id)

  const url = id && `http://localhost:8080/recv/${id}`

  const onDrop = (files: ImageFile[]) => {
    const handshakeApi = new HandshakeApi('ws://localhost:9090/ws', uuid(), 'offer')
    const dataChannel = handshakeApi.peerConnection.createDataChannel('files')
    dataChannel.onclose = () => dispatch(changeDataReady('not-ready'))
    dataChannel.onopen = () => {
      dispatch(changeDataReady('ready'))
    }

    dispatch(addFiles(files))
    dispatch(updateHandshakeData(handshakeApi, dataChannel))

    handshakeApi.startHandshake().then(() => console.log('Handshake Done!'))
  }

  return (
    <div>
      <h1>QR Share</h1>

      <div className="dropzone">
        <Dropzone onDrop={onDrop}>
          This is the dropzone
        </Dropzone>
      </div>

      <div>
        Link: <a href={url} target="_blank">{ url }</a>
      </div>

      <div>
        <h3>Files</h3>
        <ul>
          { files.map((file) => (
            <li key={file.name}>
              { file.name }
              { file.preview && <img height="100px" width="100px" src={file.preview} /> }
            </li>
          )) }
        </ul>
      </div>
    </div>
  )
}

const mapStateToProps = (state: {
  uploader: UploaderState,
}) => {
  const { files, handshakeApi } = state.uploader
  const id = handshakeApi && handshakeApi.id

  return { id, files }
}

export default connect(mapStateToProps)(Chat)