import { ConnectionState, ScopeType } from './handshake-api'

const wrappedSend = (action: string, label: string, value: number) => {
  try {
    if (window.gtag) {
      console.log('Sending event (GA tag):', action, label, value)
      window.gtag('event', action, {
        event_label: label,
        value,
      })
    } else {
      console.log('Sending event:', action, label, value)
    }
  } catch (err) {
    console.log('Analytics: error detected ', err)
  }
}

export const trackOnDrop = (scope: ScopeType, numFiles: number) => {
  wrappedSend('onDrop.numFiles', scope, numFiles)
}

export const trackFileSize = (scope: ScopeType, size: number) => {
  wrappedSend('fileTransfer.bits', scope, size)
}

export const trackConnectionMethod = (connectionState: ConnectionState, scope: ScopeType) => {
  wrappedSend(connectionState, scope, 0)
}