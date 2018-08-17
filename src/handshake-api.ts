import * as uuid from 'uuid/v1'
import * as base64 from 'base64-js'

import { encrypt, decrypt, KeyIV } from './crypto-utils'
import { waitFor, resolveAfter } from './promise-utils'

const GoogleStun = 'stun:stun.l.google.com:19302'
const GoogleIceConfig = {
  iceServers: [ { urls: GoogleStun } ],
}

const TwilioStun = 'stun:global.stun.twilio.com:443?transport=tcp'
const TwilioServers = [
  'turn:global.turn.twilio.com:443?transport=tcp',
]

type IceServer = {
  urls: string
  username?: string
  credential?: string
}

const makeConfig = () => {
  if (window.USERNAME.length === 0 || window.PASSWORD.length === 0) {
    return GoogleIceConfig
  }

  const iceServers: IceServer[] = TwilioServers.map((url) => ({
    urls: url,
    username: window.USERNAME,
    credential: window.PASSWORD,
  }))
  iceServers.unshift({ urls: TwilioStun })
  console.log('makeConfig: Using ICE configuration', iceServers)

  return { iceServers, iceCandidatePoolSize: 8 }
}

export type DataSender = (data: string | ArrayBuffer) => Promise<void>

export type ConnectionState = 'connecting' | 'webrtc' | 'websocket'

type HandshakeApiMessageType = 'offer' | 'get-offer' | 'answer' | 'candidate' | 'data-string' | 'data-binary'

type HandshakeApiMessage = {
  id: string
  mesgType: HandshakeApiMessageType
  data: string
}

type ScopeType = 'offer' | 'answer'

class HandshakeApi {
  private ws: WebSocket
  private openMessages: { [id: string ]: () => void }
  private remoteSet: Promise<any>
  private rtcDataChannel: RTCDataChannel

  url: string
  id: string
  scope: ScopeType
  peerConnection: RTCPeerConnection
  connectionState: ConnectionState
  onData?: DataSender
  keyIV?: KeyIV
  exportedKeyIV?: string

  constructor(baseUrl: string, id: string, scope: ScopeType) {
    const scopeVal = scope === 'offer' ? 0 : 1

    this.url = `${baseUrl}?id=${id}&scope=${scopeVal}`
    this.id = id
    this.scope = scope
    this.openMessages = {}

    this.ws = new WebSocket(this.url)
    this.ws.onmessage = this.onWsMessage

    this.peerConnection = new RTCPeerConnection(makeConfig())
    this.remoteSet = this.waitForRemoteSet()
    this.connectionState = 'connecting'

    // @ts-ignore
    window.pc = this.peerConnection
  }

  private waitForRemoteSet = (): Promise<any> => {
    return new Promise((resolve) => {
      let tries = 0
      const waiter = () => {
        tries += 1
        const { remoteDescription } = this.peerConnection
        if (remoteDescription && remoteDescription.type.length > 0) {
          return resolve()
        } else {
          return setTimeout(waiter, 500)
        }
      }

      waiter()
    })
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

      case 'data-string':
        return this.handleData(mesg)

      case 'data-binary':
        return this.handleData(mesg)

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
    this.remoteSet.then(() => {
      console.log('handleCandidates: calling addIceCandidate', candidate)
      this.peerConnection.addIceCandidate(candidate)
        .then(() => console.log('handleCandidate: Added ice candidate', candidate))
        .catch((err) => console.log('handleCandidate: error adding ice candidate', err, candidate))
    })
  }

  private handleData = (mesg: HandshakeApiMessage) => {
    this.connectionState = 'websocket'

    let data
    switch (mesg.mesgType) {
      case 'data-string':
        data = mesg.data
        break

      case 'data-binary':
        data = <ArrayBuffer>base64.toByteArray(mesg.data).buffer
        break
    }

    if (this.onData) {
      const dataToSend = this.keyIV ? decrypt(data, this.keyIV) : Promise.resolve(data)

      dataToSend.then(this.onData)
    }

    this.onData && this.onData(data)
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
          this.rtcDataChannel = this.peerConnection.createDataChannel('data') // Important. ICE connection won't be created until data channel is created

          return resolve()
        }

        setTimeout(waitForReady, 50)
      }

      waitForReady()
    })

    return openPromise
  }

  private waitForIceConnected = (): Promise<void> => {
    const webRtcConnected = waitFor(() => this.peerConnection.iceConnectionState === 'completed' && this.rtcDataChannel.readyState === 'open')
      .then(() => 'webrtc')

    const timeoutFallback = resolveAfter(2000).then(() => 'websocket')

    return Promise.race([ webRtcConnected, timeoutFallback ]).then((state: ConnectionState) => {
      this.connectionState = state
    })
  }

  private setDataListeners = () => {
    this.peerConnection.ondatachannel = (evt) => {
      this.connectionState = 'webrtc'
      const { channel } = evt

      if (channel.label === 'data') {
        channel.onmessage = ({ data }: { data: string | ArrayBuffer }) => {
          if (this.onData) {
            const dataToSend = this.keyIV ? decrypt(data, this.keyIV) : Promise.resolve(data)

            dataToSend.then(this.onData)
          }
        }
      }
    }
  }

  private sendFallback = (data: string | ArrayBuffer): Promise<void> => {
    let mesg: HandshakeApiMessage
    if (typeof data === 'string') {
      mesg = {
        id: uuid(),
        mesgType: 'data-string',
        data,
      }
    } else {
      const buffer = <ArrayBuffer>data
      const bytes = new Uint8Array(buffer, 0, buffer.byteLength)

      mesg = {
        id: uuid(),
        mesgType: 'data-binary',
        data: base64.fromByteArray(bytes)
      }
    }

    return this.wsSend(mesg)
  }

  // Called by the offerer to start handshake
  startHandshake = (): Promise<any> => {
    return this.init()
      .then(() => this.peerConnection.createOffer())
      .then((offer) => {
        return this.peerConnection.setLocalDescription(offer)
          .then(() => this.wsSend({
            id: uuid(),
            mesgType: 'offer',
            data: JSON.stringify(offer),
          }))
      })
      .then(this.waitForAnswer)
      .then(this.waitForIceConnected)
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
      .then(this.setDataListeners)
  }

  send: DataSender = (data): PromiseLike<void> => {
    const dataPromise = this.keyIV ? encrypt(data, this.keyIV) : Promise.resolve(data)

    dataPromise.then((dataToSend) => {
      switch (this.connectionState) {
        case 'webrtc':
          return Promise.resolve(this.rtcDataChannel.send(dataToSend))

        case 'websocket':
          return this.sendFallback(data)

        default:
          return Promise.reject(`HandshakeApi: invalid connectionState: ${this.connectionState}`)
      }
    })
  }
}

export default HandshakeApi