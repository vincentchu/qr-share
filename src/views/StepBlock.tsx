import * as React from 'react'

type StepBlockProps = {
  header: string
  subHeader: string
}

const StepBlock: React.SFC<StepBlockProps> = (props) => {
  const { header, subHeader } = props

  return (
    <div className="block block-bordered text-center">
      <h2>{ header }</h2>

      <h4>{ subHeader }</h4>
    </div>
  )
}

export default StepBlock