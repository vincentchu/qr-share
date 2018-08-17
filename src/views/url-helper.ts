export const ProdHost = 'qqsend.me'
export const DevHost = 'localhost:8080'

export const ProdWebsocketUrl = `${ProdHost}/ws`
export const DevWebsocketUrl = 'localhost:9090/ws'

export const isProd = window.location.host == ProdHost

export const urlForReceive = (id: string, keyIV: string): string => {
  const baseUrl = isProd ? `https://${ProdHost}` : `http://${DevHost}`

  return `${baseUrl}/recv/${id}/#${keyIV}`
}

export const WebsocketUrl = isProd ? `wss://${ProdWebsocketUrl}` : `ws://${DevWebsocketUrl}`