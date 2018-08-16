import * as React from 'react'
import { ImageFile } from 'react-dropzone'
import * as QRCode from 'qrcode.react'

import StepBlock from '../StepBlock'
import { urlForReceive } from '../url-helper'
import { ConnectionState } from '../../handshake-api'

type UploadProps = {
  id: string
  files: ImageFile[]
  connectionState: ConnectionState
}

const Upload: React.SFC<UploadProps> = (props) => {
  const { id, files, connectionState } = props
  const url = urlForReceive(id)

  return (
    <div className="row">
      <div className="block text-center">
        <QRCode value={url} level="Q" size={200} />
        <h4>
          <a href={url}>Link</a>
        </h4>
      </div>
      <StepBlock
        header="Step 2: Scan QR code or share link"
        subHeader="Note: Expires in ~15 seconds"
      />
    </div>
  )
}

export default Upload