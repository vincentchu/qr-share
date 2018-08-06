import { Action, ActionCreator, Reducer, AnyAction } from 'redux'

export type ConnectionState = {
  connection?: RTCPeerConnection
}

const CREATE_CONN = 'state-connection/CREATE'

type CreateConnection = {
  connection: RTCPeerConnection
} & Action<string>

export const reducer: Reducer<ConnectionState, AnyAction> = (
  state: ConnectionState = {},
  action: AnyAction
) => {
  switch (action.type) {
    case CREATE_CONN: {
      const { connection } = <CreateConnection>action
      return {
        ...state,
        connection,
      }
    }

    default:
      return state
  }
}

export const createConnection: ActionCreator<CreateConnection> = () => ({
  type: CREATE_CONN,
  connection: new RTCPeerConnection(null)
})