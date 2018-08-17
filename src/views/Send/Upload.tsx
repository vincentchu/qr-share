import * as React from 'react'
import { ImageFile } from 'react-dropzone'
import * as QRCode from 'qrcode.react'

import FileList from './FileList'
import Progress from '../Progress'
import StepBlock from '../StepBlock'
import { urlForReceive } from '../url-helper'
import { ConnectionState } from '../../handshake-api'
import { FileStub, FileTransfer } from '../../state/shared'

type UploadProps = {
  id: string
  files: ImageFile[]
  connectionState: ConnectionState
  currentFile?: FileStub
  currentTransfer?: FileTransfer
  transferredFiles: Set<string>
}

const Upload: React.SFC<UploadProps> = (props) => {
  const { id, files, connectionState, currentFile, currentTransfer, transferredFiles } = props
  const url = urlForReceive(id)

  return (
    <div className="row justify-content-center">
      <div className="block text-center">
        <a href={url} target="_blank">
          <QRCode value={url} level="Q" size={200} />
        </a>

        <FileList files={files} transferredFiles={transferredFiles} />

        <Progress
          connectionState={connectionState}
          currentFile={currentFile} currentTransfer={currentTransfer}
        />
      </div>
      <StepBlock
        header="Step 2: Scan QR code or share link"
        subHeader="Note: Expires in ~15 seconds"
      />
    </div>
  )
}

export default Upload