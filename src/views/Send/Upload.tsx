import * as React from 'react'
import { ImageFile } from 'react-dropzone'
import * as QRCode from 'qrcode.react'
import { isNil } from 'ramda'

import FileList from './FileList'
import Progress from '../Progress'
import { StepTwo } from '../StepBlock'
import { urlForReceive } from '../url-helper'
import { ConnectionState } from '../../handshake-api'
import { FileStub, FileTransfer } from '../../state/shared'

type UploadProps = {
  id: string
  keyIV: string
  files: ImageFile[]
  connectionState: ConnectionState
  currentFile?: FileStub
  currentTransfer?: FileTransfer
  transferredFiles: Set<string>
}

const Upload: React.SFC<UploadProps> = (props) => {
  const { id, keyIV, files, connectionState, currentFile, currentTransfer, transferredFiles } = props
  const url = urlForReceive(id, keyIV)
  const isDone = (transferredFiles.size > 0) && isNil(currentFile)

  return (
    <div className="row justify-content-center">
      <div className="block text-center">
        <a href={url} target="_blank">
          <QRCode value={url} level="Q" size={200} />
        </a>

        <FileList files={files} transferredFiles={transferredFiles} />

        { !isDone && <Progress
          connectionState={connectionState}
          currentFile={currentFile} currentTransfer={currentTransfer}
        /> }

        { isDone && (
          <div className="finished">
            <a className="btn btn-success btn-lg" href="/" role="button">
              Transfer Complete. Send More?
            </a>
          </div>
        ) }
      </div>

      <StepTwo />
    </div>
  )
}

export default Upload