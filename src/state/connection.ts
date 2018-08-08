import { Action, ActionCreator, Reducer, AnyAction, ActionCreatorsMapObject } from 'redux'
import HandshakeApi from '../handshake-api'

export type ConnectionState = {
  handshake?: HandshakeApi
}

const ADD_HANDSHAKE = 'state-connection/add-handshake'

type AddHandshake = {
  handshake: HandshakeApi
} & Action<string>


export const reducer: Reducer<ConnectionState, AnyAction> = (
  state: ConnectionState = {},
  action: AddHandshake
) => {
  switch (action.type) {
    case ADD_HANDSHAKE: {
      const { handshake } = <AddHandshake>action
      return {
        ...state,
        handshake,
      }
    }

    default:
      return state
  }
}

export const addHandshake: ActionCreator<AddHandshake> = (handshake: HandshakeApi) => ({
  type: ADD_HANDSHAKE,
  handshake,
})
