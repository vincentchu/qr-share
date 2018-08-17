import * as React from 'react'
import Dropzone, { DropFilesEventHandler } from 'react-dropzone'

import StepBlock from '../StepBlock'

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
          <h4 className="text-muted">Send pictures and files between your iPhone, Android, or Desktop browser</h4>
          <button className="btn btn-primary btn-lg mt-1" disabled={!window.isModern}>Select Files</button>
        </div>
        <StepBlock
          header="Step 1: Select your files"
          subHeader="(or just drag and drop them into the window)"
        />
      </div>
    </Dropzone>
  )
}

export default FilePicker