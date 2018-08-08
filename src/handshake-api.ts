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
        return this.handleAnswer(mesg)

      case 'candidate':
        return this.handleCandidate(mesg)

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
    const maybeCallback = this.openMessages['offer']
    if (maybeCallback) {
      maybeCallback()
      delete this.openMessages['offer']
    }

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

  handleAnswer = (mesg: HandshakeApiMessage) => {
    const answer: RTCSessionDescriptionInit = JSON.parse(mesg.data)
    const maybeCallback = this.openMessages['answer']

    if (maybeCallback) {
      console.log('handleAnswer: Settting local description')
      this.rtcConn.setRemoteDescription(answer)

      maybeCallback()
      delete this.openMessages['answer']
    }
  }

  handleCandidate = (mesg: HandshakeApiMessage) => {
    const candidate: RTCIceCandidate = JSON.parse(mesg.data)

    console.log('handleCandidate: Received and adding ice candidate', candidate)
    this.rtcConn.addIceCandidate(candidate)
  }

  onIceCandidate  = (iceEvt: RTCPeerConnectionIceEvent) => {
    console.log('RECV ice', iceEvt.candidate)

    if (iceEvt.candidate) {
      this.wsSend({
        id: uuid(),
        mesgType: 'candidate',
        data: JSON.stringify(iceEvt.candidate)
      })
    }
  }

  waitForAnswer = (): Promise<any> => {
    return new Promise((resolve) => {
      this.openMessages['answer'] = resolve
    })
  }

  init = (): Promise<any> => {
    let tries = 0
    const openPromise = new Promise((resolve) => {
      const waitForReady = () => {
        tries = tries + 1
        if (this.ws.readyState !== WebSocket.CONNECTING) {
          this.rtcConn.onicecandidate = this.onIceCandidate

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

  openDataChannel = (name: string): Promise<RTCDataChannel> => {
    const chan = this.rtcConn.createDataChannel(name)

    let tries = 0
    const openPromise = new Promise<RTCDataChannel>((resolve) => {
      const waitForReady = () => {
        tries = tries + 1
        console.log('chan', chan.readyState, tries)
        if (chan.readyState != 'connecting') {
          return resolve(chan)
        }

        setTimeout(waitForReady, 50)
      }

      waitForReady()
    })

    return openPromise
  }
}

export default HandshakeApi