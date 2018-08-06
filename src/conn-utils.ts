export const createOffer = (conn: RTCPeerConnection): Promise<RTCSessionDescriptionInit> =>
  conn.createOffer()

export const createAnswer = (conn: RTCPeerConnection): Promise<RTCSessionDescriptionInit> =>
  conn.createAnswer()