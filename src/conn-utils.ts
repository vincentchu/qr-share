export const createOffer = (conn: RTCPeerConnection): Promise<RTCSessionDescriptionInit> =>
  conn.createOffer()

export const createAnswer = (conn: RTCPeerConnection): Promise<RTCSessionDescriptionInit> =>
  conn.createAnswer()

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