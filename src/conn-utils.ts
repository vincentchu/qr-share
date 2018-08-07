export const startHandshake = (conn: RTCPeerConnection): Promise<RTCSessionDescriptionInit> =>
  conn.createOffer().then((offer) => {
    conn.setLocalDescription(offer)

    return offer
  })

export const receiveHandshake = (conn: RTCPeerConnection, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> => {
  conn.setRemoteDescription(offer)

  return conn.createAnswer().then((answer) => {
    conn.setLocalDescription(answer)

    return answer
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