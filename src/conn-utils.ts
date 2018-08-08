type Handshake = {
  websocketApi: WebSockAPI
  offer?: RTCSessionDescriptionInit
  answer?: RTCSessionDescriptionInit
}

export const startHandshake = (conn: RTCPeerConnection, id: string): Promise<Handshake> => {
  const url = `ws://localhost:9090/ws?id=${id}&scope=0`
  const wsApi = new WebSockAPI(url)

  return Promise.all([ conn.createOffer(), wsApi.open() ]).then(([ offer ]) => {
    conn.setLocalDescription(offer)

    return wsApi.updateOffer(btoa(offer.sdp)).then(() => ({
      websocketApi: wsApi,
      offer,
    }))
  })
}

export const receiveHandshake = (conn: RTCPeerConnection, id: string): Promise<Handshake> => {
  const url = `ws://localhost:9090/ws?id=${id}&scope=1`
  const wsApi = new WebSockAPI(url)

  return wsApi.open()
    .then(wsApi.getOffer)
    .then((encodedSDP) => {
      const offer = decodeOffer(encodedSDP)
      return conn.setRemoteDescription(offer)
    })
    .then(() => conn.createAnswer())
    .then((answer) => {
      console.log('Updating answer', btoa(answer.sdp))
      conn.setLocalDescription(answer)

      return wsApi.updateAnswer(btoa(answer.sdp)).then(() => ({
        websocketApi: wsApi,
        answer,
      }))
    })
}

export const urlForOffer = (offer: RTCSessionDescriptionInit): string => {
  const encodedSDP = btoa(offer.sdp)

  return `http://localhost:8080/recv/${encodedSDP}`
}

export const decodeOffer = (encodedSDP: string): RTCSessionDescriptionInit => {
  const sdp = atob(encodedSDP)

  return {
    sdp,
    type: 'offer',
  }
}

export const newWebSocket = (url: string): Promise<WebSocket> => {
  const ws = new WebSocket(url)

  let tries = 0
  const wsPromise: Promise<WebSocket> = new Promise((resolve) => {
    const waitForReady = () => {
      tries = tries + 1
      if (ws.readyState !== WebSocket.CONNECTING) {
        return resolve(ws)
      }

      setTimeout(waitForReady, 50)
    }

    waitForReady()
  })

  return wsPromise
}

class WebSockAPI {
  url: string
  ws: WebSocket

  constructor(url: string) {
    this.url = url
    this.ws = new WebSocket(url)
  }

  open = (): Promise<any> => {
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

  updateOffer = (offer: string): Promise<any> => {
    return new Promise((resolve) => {
      this.ws.onmessage = (mesg) => {
        if (mesg.data === offer) {
          resolve()
        }
      }

      this.ws.send(`0 ${offer}`)
    })
  }

  updateAnswer = (answer: string): Promise<any> => {
    return new Promise((resolve) => {
      this.ws.onmessage = (mesg) => {
        if (mesg.data === answer) {
          resolve()
        }
      }

      this.ws.send(`1 ${answer}`)
    })
  }

  getOffer = (): Promise<string> => {
    return new Promise((resolve) => {
      this.ws.onmessage = (mesg) => {
        resolve(mesg.data)
      }

      this.ws.send('2')
    })
  }

  waitForAnswer = (): Promise<RTCSessionDescriptionInit> => {
    return new Promise((resolve) => {
      this.ws.onmessage = (mesg) => {
        const answer: RTCSessionDescriptionInit = {
          sdp: atob(mesg.data),
          type: 'answer',
        }

        console.log(' waitForAnswer MESG', mesg, answer)

        resolve(answer)
      }
    })
  }

  sendCandidate = (candidate: RTCIceCandidate): Promise<any> => {
    return new Promise((resolve) => {
      const encodedCandidate = btoa(JSON.stringify(candidate))

      this.ws.send(encodedCandidate)
      resolve()
    })
  }
}

// @ts-ignore
window.WebSockAPI = WebSockAPI