import * as uuid from 'uuid/v1'

const Config = {
  iceServers: [ { urls: 'stun:stun.l.google.com:19302' } ],
}

type HandshakeApiMessageType = 'offer'

type HandshakeApiMessage = {
  id: string
  mesgType: HandshakeApiMessageType
  data: any
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

    // handle message here
  }

  wsSend = (mesg: HandshakeApiMessage): Promise<any> => {
    return new Promise((resolve) => {
      this.openMessages[mesg.id] = () => resolve()

      this.ws.send(JSON.stringify(mesg))
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

  startHandshake = (): Promise<any> => {
    return this.init()
      .then(() => this.rtcConn.createOffer())
      .then((offer) => this.wsSend({
        id: uuid(),
        mesgType: 'offer',
        data: JSON.stringify(offer),
      }))




    // return Promise.all([ this.rtcConn.createOffer(), this.init() ])
    //   .then(([ offer ]) => {})


  }
}

export default HandshakeApi