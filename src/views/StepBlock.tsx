import * as React from 'react'

type StepBlockProps = {
  header: string
  subHeader: string
  animation?: string
}

const StepBlock: React.SFC<StepBlockProps> = (props) => {
  const { header, subHeader, animation } = props

  return (
    <div className="block block-bordered text-center">
      <h2>{ header }</h2>

      <h4>{ subHeader }</h4>

      { animation && <img className="step-block-animation" src={animation} />}
    </div>
  )
}

export const StepOne: React.SFC<{}> = () => (
  <StepBlock
    header="Step 1: Select your files"
    subHeader="(or drop them into the window)"
    animation="/qqsend-desktop-300.gif"
  />
)

export const StepTwo: React.SFC<{}> = () => (
  <StepBlock
    header="Step 2: Scan QR code using your iPhone camera"
    subHeader="Don't worry, your files are sent with 256-bit AES encryption"
    animation="/qqsend-mobile-300.gif"
  />
)

export default StepBlock