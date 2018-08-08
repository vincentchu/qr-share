import * as uuid from 'uuid/v1'

const Config = {
  iceServers: [ { urls: 'stun:stun.l.google.com:19302' } ],
}

type HandshakeApiMessageType = 'offer' | 'get-offer' | 'answer'

type HandshakeApiMessage = {
  id: string
  mesgType: HandshakeApiMessageType
  data: string
}

class HandshakeApi {
  url: string
  ws: WebSocket
  rtcConn: RTCPeerConnection
  openMessages: { [id: string ]: () => void }

  constructor(url: string) {
    this.url = url
    this.ws = new WebSocket(url)
    this.rtcConn = new RTCPeerConnection(Config)
    this.openMessages = {}

    this.ws.onmessage = this.onWsMessage
  }

  onWsMessage = (mesgEvt: MessageEvent) => {
    const mesg: HandshakeApiMessage = JSON.parse(mesgEvt.data)
    console.log('onWsMessage: Received message', mesg)

    const maybeCallback = this.openMessages[mesg.id]
    if (maybeCallback) {
      maybeCallback()
      delete this.openMessages[mesg.id]
      console.log('onWsMessage: Cleaned up open message', this.openMessages)

      return
    }

    switch (mesg.mesgType) {
      case 'offer':
        return this.handleOffer(mesg)

      case 'answer':
        break

        default:
          console.log('onWsMessage: Unexpected message type', mesg)
    }
  }

  wsSend = (mesg: HandshakeApiMessage): Promise<any> => {
    return new Promise((resolve) => {
      this.openMessages[mesg.id] = resolve

      this.ws.send(JSON.stringify(mesg))
    })
  }

  handleOffer = (mesg: HandshakeApiMessage) => {
    const offer: RTCSessionDescriptionInit = JSON.parse(mesg.data)

    this.rtcConn.setRemoteDescription(offer)
    this.rtcConn.createAnswer()
      .then((answer) => {
        console.log('handleOffer: Setting local/remote description and sending answer')
        this.rtcConn.setLocalDescription(answer)

        return this.wsSend({
          id: uuid(),
          mesgType: 'answer',
          data: JSON.stringify(answer),
        })
      })
  }

  init = (): Promise<any> => {
    let tries = 0
    const openPromise = new Promise((resolve) => {
      const waitForReady = () => {
        tries = tries + 1
        if (this.ws.readyState !== WebSocket.CONNECTING) {
          return resolve()
        }

        setTimeout(waitForReady, 50)
      }

      waitForReady()
    })

    return openPromise
  }

  // Called by the offerer to start handshake
  startHandshake = (): Promise<any> => {
    return this.init()
      .then(() => this.rtcConn.createOffer())
      .then((offer) => {
        this.rtcConn.setLocalDescription(offer)

        return this.wsSend({
          id: uuid(),
          mesgType: 'offer',
          data: JSON.stringify(offer),
        })
      })
      .then(this.waitForAnswer)
  }

  // Called by the answerer to initiate receipt of offer
  receiveHandshake = (): Promise<any> => {
    const recvOfferPromise = new Promise((resolve) => {
      this.openMessages['offer'] = resolve
    })

    const sendGetOfferPromise = this.init()
      .then(() => this.wsSend({
        id: uuid(),
        mesgType: 'get-offer',
        data: '',
      }))

    return Promise.all([ sendGetOfferPromise, recvOfferPromise ])
  }

  waitForAnswer = (): Promise<any> => {
    return new Promise((resolve) => {
      this.openMessages['answer'] = resolve
    })
  }
}

export default HandshakeApi