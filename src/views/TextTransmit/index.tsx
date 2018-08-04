import * as React from 'react'

type TextTransmitState = {
  localConnection?: RTCPeerConnection
  remoteConnection?: RTCPeerConnection
  sendChannel?: RTCDataChannel
}

class TextTransmit extends React.Component<{}, TextTransmitState> {
  constructor(props: {}) {
    super(props)
    this.state = {}
  }

  componentWillMount() {
    console.log('WillMount')
    const localConnection = new RTCPeerConnection(null)
    const remoteConnection = new RTCPeerConnection(null)
    const sendChannel = localConnection.createDataChannel("SendChannel")

    localConnection.onicecandidate = this.onIceCandidate('local')
    remoteConnection.onicecandidate = this.onIceCandidate('remote')
    sendChannel.onopen = this.onSendChannelOpen
    sendChannel.onclose = this.onSendChannelClose

    this.setState({ localConnection, remoteConnection, sendChannel })

    localConnection.createOffer()
      .then((sessInit: RTCSessionDescriptionInit) => {
        console.log('OFFER', sessInit)
        localConnection.setLocalDescription(sessInit)
        remoteConnection.setRemoteDescription(sessInit)

        remoteConnection.createAnswer()
          .then((answer) => {
            console.log('ANSWER', answer)
            remoteConnection.setLocalDescription(answer)
            localConnection.setRemoteDescription(answer)

            remoteConnection.ondatachannel = this.onDataChannel
          })
          .catch((err: Error) => console.log('ANSWER FAIL', err))
      })
      .catch((err: Error) => console.log('Offer Error', err))
  }

  onIceCandidate = (label: string) => (evt: RTCPeerConnectionIceEvent) => {
    console.log(`onIceCandidate - ${label}`, evt)
    const otherConn = (label === 'local') ? this.state.remoteConnection : this.state.localConnection

    otherConn.addIceCandidate(evt.candidate)
      .then(() => console.log(`iceCandidate success: ${label}`))
      .catch((err: Error) => console.log(`iceCandidate fail: ${label}`, err))
  }

  onSendChannelOpen = (evt: Event) => {
    console.log('onSendChannelOpen', evt)

    this.state.sendChannel.send('hello, world')
  }

  onSendChannelClose = (evt: Event) => {
    console.log('onSendChannelClose', evt)
  }

  onDataChannel = (evt: RTCDataChannelEvent) => {
    console.log('RECV:', evt)
    const recvChannel = evt.channel
    recvChannel.onmessage = this.onMessage
  }

  onMessage = (mesg: MessageEvent) => {
    console.log('onMessage', mesg.data)
  }

  render() {
    return (
      <div>
        Text transmit
      </div>
    )
  }
}

export default TextTransmit