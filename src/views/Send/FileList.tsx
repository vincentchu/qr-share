import * as React from 'react'

import { ImageFile } from 'react-dropzone'

type PreviewProps = {
  src?: string
  type: string
}

const FileStyle = {
  backgroundImage: 'url(\'/file.svg\')',
  backgroundPositionX: '6px',
  backgroundSize: 'contain',
}

const Preview: React.SFC<PreviewProps> = (props) => {
  const { src, type } = props

  let style: Object = FileStyle
  if (type.match(/^image/) && src) {
    style = {
      ...style,
      backgroundImage: `url(\'${src}\')`,
      backgroundPositionX: '0px',
      backgroundSize: 'cover',
    }
  }

  return (
    <div className="preview" style={style} />
  )
}

type FileListProps = {
  files: ImageFile[]
}

// type image or not

const FileList: React.SFC<FileListProps> = (props) => {
  const { files } = props

  return (
    <div className="file-list">
      { files.map((file) => <Preview key={file.name} src={file.preview} type={file.type} /> )}
    </div>
  )
}

export default FileList