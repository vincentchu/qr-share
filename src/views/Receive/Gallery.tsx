import * as React from 'react'
import * as filesize from 'filesize'

const loadFile = (file: File): Promise<FileReader> => {
  const reader = new FileReader()
  reader.readAsDataURL(file)

  return new Promise((resolve) => {
    reader.onload = () => resolve(reader)
  })
}

type CardProps = {
  file: File
}

const FileStyle = 'background-image: url(\'/file.svg\'); background-size: contain; background-position-x: 45px;'

const Card: React.SFC<CardProps> = (props) => {
  const { file } = props
  const isImg = !!file.type.match(/^image/)
  const readerPromise = loadFile(file)

  const ref = (div: any) => {
    if (div) {
      if (isImg) {
        readerPromise.then((reader) => {
          div.style = `background-image: url('${reader.result}'); background-size: cover;`
        })
      } else {
        div.style = FileStyle
      }
    }
  }

  const aRef = (a: any) => {
    if (a) {
      readerPromise.then((reader) => {
        a.download = file.name
        a.href = reader.result
      })
    }
  }

  return (
    <div className="card gallery-card">
      <div className="card-img-top gallery-img" ref={ref}/>

      <div className="card-body">
        <div className="card-title-container">
          <h5 className="card-title">{ file.name }</h5>
        </div>
        <p className="card-text">
          <a ref={aRef} target="_blank">
            <img className="download" src="/cloud-download.svg" />
            { filesize(file.size, ) }
          </a>
        </p>
      </div>

    </div>

  )
}

type GalleryProps = {
  files: File[]
}

const Gallery: React.SFC<GalleryProps> = (props) => {
  const { files } = props

  return (
    <div className="gallery">
      { files.map((file) => <Card key={file.name} file={file} /> )}
    </div>
  )
}

export default Gallery