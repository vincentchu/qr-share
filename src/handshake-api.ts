import * as uuid from 'uuid/v1'

const Config = {
  iceServers: [ { urls: 'stun:stun.l.google.com:19302' } ],
}

type HandshakeApiMessageType = 'offer' | 'get-offer' | 'answer' | 'candidate'

type HandshakeApiMessage = {
  id: string
  mesgType: HandshakeApiMessageType
  data: string
}

type ScopeType = 'offer' | 'answer'

class HandshakeApi {
  private ws: WebSocket
  private openMessages: { [id: string ]: () => void }

  url: string
  id: string
  scope: ScopeType
  peerConnection: RTCPeerConnection

  constructor(baseUrl: string, id: string, scope: ScopeType) {
    const scopeVal = scope === 'offer' ? 0 : 1

    this.url = `${baseUrl}?id=${id}&scope=${scopeVal}`
    this.ws = new WebSocket(this.url)
    this.ws.onmessage = this.onWsMessage

    this.peerConnection = new RTCPeerConnection(Config)
    this.openMessages = {}
  }

  private onWsMessage = (mesgEvt: MessageEvent) => {
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
        return this.handleAnswer(mesg)

      case 'candidate':
        return this.handleCandidate(mesg)

      default:
        console.log('onWsMessage: Unexpected message type', mesg)
    }
  }

  private wsSend = (mesg: HandshakeApiMessage): Promise<any> => {
    return new Promise((resolve) => {
      this.openMessages[mesg.id] = resolve

      this.ws.send(JSON.stringify(mesg))
    })
  }

  private handleOffer = (mesg: HandshakeApiMessage) => {
    const offer: RTCSessionDescriptionInit = JSON.parse(mesg.data)
    const maybeCallback = this.openMessages['offer']
    if (maybeCallback) {
      maybeCallback()
      delete this.openMessages['offer']
    }

    this.peerConnection.setRemoteDescription(offer)
    this.peerConnection.createAnswer()
      .then((answer) => {
        console.log('handleOffer: Setting local/remote description and sending answer')
        this.peerConnection.setLocalDescription(answer)

        return this.wsSend({
          id: uuid(),
          mesgType: 'answer',
          data: JSON.stringify(answer),
        })
      })
  }

  private handleAnswer = (mesg: HandshakeApiMessage) => {
    const answer: RTCSessionDescriptionInit = JSON.parse(mesg.data)
    const maybeCallback = this.openMessages['answer']

    if (maybeCallback) {
      console.log('handleAnswer: Settting local description')
      this.peerConnection.setRemoteDescription(answer)

      maybeCallback()
      delete this.openMessages['answer']
    }
  }

  private handleCandidate = (mesg: HandshakeApiMessage) => {
    const candidate: RTCIceCandidate = JSON.parse(mesg.data)

    console.log('handleCandidate: Received and adding ice candidate', candidate)
    this.peerConnection.addIceCandidate(candidate)
  }

  private onIceCandidate  = (iceEvt: RTCPeerConnectionIceEvent) => {
    console.log('onIceCandidate: Received candidate', iceEvt.candidate)

    if (iceEvt.candidate) {
      this.wsSend({
        id: uuid(),
        mesgType: 'candidate',
        data: JSON.stringify(iceEvt.candidate)
      })
    }
  }

  private waitForAnswer = (): Promise<any> => {
    return new Promise((resolve) => {
      this.openMessages['answer'] = resolve
    })
  }

  private init = (): Promise<any> => {
    let tries = 0
    const openPromise = new Promise((resolve) => {
      const waitForReady = () => {
        tries = tries + 1
        if (this.ws.readyState !== WebSocket.CONNECTING) {
          this.peerConnection.onicecandidate = this.onIceCandidate

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
      .then(() => this.peerConnection.createOffer())
      .then((offer) => {
        this.peerConnection.setLocalDescription(offer)

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
}

export default HandshakeApi