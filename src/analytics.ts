import { ConnectionState, ScopeType } from './handshake-api'

const wrappedSend = (action: string, label: string, value: number) => {
  try {
    if (window.ga) {
      console.log('Sending event (GA):', action, label, value)
      window.ga('send', 'event', 'metrics', action, label, value)
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