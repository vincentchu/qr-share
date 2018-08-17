import * as React from 'react'
import * as filesize from 'filesize'

type CardProps = {
  file: File
}

const FileStyle = 'background-image: url(\'/file.svg\'); background-size: contain; background-position-x: 45px;'

const Card: React.SFC<CardProps> = (props) => {
  const { file } = props
  const isImg = !!file.type.match(/^image/)

  const ref = (div: any) => {
    console.log('isImg', isImg)
    if (isImg) {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        if (div) {
          div.style = `background-image: url('${reader.result}'); background-size: cover;`
        }
      }
    } else {
      if (div) {
        div.style = FileStyle
      }
    }
  }

  const aRef = (a: any) => {
    if (a) {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        if (a) {
          a.href = reader.result
        }
      }
      a.download = file.name
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

  console.log('FILES', files)
  return (
    <div className="gallery">
      { files.map((file) => <Card key={file.name} file={file} /> )}
    </div>
  )
}

export default Gallery