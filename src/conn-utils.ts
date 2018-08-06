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