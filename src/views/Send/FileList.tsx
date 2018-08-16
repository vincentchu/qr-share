import * as React from 'react'
import classnames from 'classnames'

import { ImageFile } from 'react-dropzone'

type PreviewProps = {
  src?: string
  type: string
  transferred: boolean
}

const FileStyle = {
  backgroundImage: 'url(\'/file.svg\')',
  backgroundPositionX: '6px',
  backgroundSize: 'contain',
}

const Preview: React.SFC<PreviewProps> = (props) => {
  const { src, type, transferred } = props

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
    <div className={classnames('preview', transferred && 'transferred')} style={style} />
  )
}

type FileListProps = {
  files: ImageFile[]
  transferredFiles: Set<string>
}

// type image or not

const FileList: React.SFC<FileListProps> = (props) => {
  const { files, transferredFiles } = props

  return (
    <div className="file-list">
      { files.map((file) => <Preview
        key={file.name} src={file.preview} type={file.type}
        transferred={transferredFiles.has(file.name)}
      /> )}
    </div>
  )
}

export default FileList