import * as React from 'react'
import Dropzone, { DropFilesEventHandler } from 'react-dropzone'

import { StepOne, StepTwo } from '../StepBlock'

type FilePickerProps = {
  onDrop: DropFilesEventHandler
}

const FilePicker: React.SFC<FilePickerProps> = (props) => {
  const { onDrop } = props

  return (
    <Dropzone onDrop={onDrop} className="foo" disabled={!window.isModern}>
      <div className="row">
        <div className="block text-center">
          <h1 className="block-title">QQSend</h1>
          <h4 className="text-muted">Send pictures and files between phones or desktop just by scanning a QR code</h4>
          <button className="btn btn-primary btn-lg mt-1" disabled={!window.isModern}>Select Files</button>
        </div>
        <StepOne />
        <StepTwo />
      </div>
    </Dropzone>
  )
}

export default FilePicker