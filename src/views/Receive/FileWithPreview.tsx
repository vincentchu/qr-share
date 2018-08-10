import * as React from 'react'

type FileWithPreviewProps = {
  file: File
}

const FileWithPreview: React.SFC<FileWithPreviewProps> = (props) => {
  const { file } = props

  const ref = (r: any) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => r.src = reader.result
  }

  return (
    <div>
      <div>name: { file.name }</div>
      <img height="150px" width="150px" ref={ref} />
    </div>
  )
}

export default FileWithPreview