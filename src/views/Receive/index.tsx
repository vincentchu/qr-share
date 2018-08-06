import * as React from 'react'
import { RouteComponentProps } from 'react-router'
import { Dispatch } from 'redux'
import { DispatchProp } from 'react-redux'

import loadingComponent from '../loading-component'
import { decodeOffer } from '../../conn-utils'

type SDPRouteProps = {
  sdp: string
}

type ReceiveProps = {
} & RouteComponentProps<SDPRouteProps> & DispatchProp

const Receive: React.SFC<ReceiveProps> = (props) => {
  console.log('PROPS', props)
  return (
    <div>
      <h1>Receive Chat</h1>
    </div>
  )
}

const loader = (dispatch: Dispatch, props: ReceiveProps): Promise<any> => {
  const { sdp } = props.match.params
  console.log('SDP!', sdp)

  const offer = decodeOffer(sdp)
  console.log('OFFER', offer)

  return Promise.resolve(1)
}

export default loadingComponent(loader, Receive)