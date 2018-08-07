import { Action, ActionCreator, Reducer, AnyAction, ActionCreatorsMapObject } from 'redux'

export type ConnectionState = {
  connection?: RTCPeerConnection
  offer?: RTCSessionDescriptionInit
  answer?: RTCSessionDescriptionInit
}

const CREATE_CONN = 'state-connection/CREATE'
const ADD_OFFER = 'state-connection/ADD_OFFER'
const ADD_ANSWER = 'state-connection/ADD_ANSWER'

type CreateConnection = {
  connection: RTCPeerConnection
} & Action<string>

type AddOffer = {
  offer: RTCSessionDescriptionInit
} & Action<string>

type AddAnswer = {
  answer: RTCSessionDescriptionInit
} & Action<string>

export const reducer: Reducer<ConnectionState, AnyAction> = (
  state: ConnectionState = {},
  action: CreateConnection | AddOffer | AddAnswer
) => {
  switch (action.type) {
    case CREATE_CONN: {
      const { connection } = <CreateConnection>action
      return {
        ...state,
        connection,
      }
    }

    case ADD_OFFER: {
      const { offer } = <AddOffer>action

      return {
        ...state,
        offer,
      }
    }

    case ADD_ANSWER: {
      const { answer } = <AddAnswer>action

      return {
        ...state,
        answer,
      }
    }

    default:
      return state
  }
}

export const createConnection: ActionCreator<CreateConnection> = () => {

  const config = { iceServers: [{ urls: 'stun:stun.example.org' }] }
  const connection = new RTCPeerConnection(config)
  connection.onicecandidate = (iceEvt) => console.log('ONICE', iceEvt)

  // @ts-ignore
  window.connection = connection

  return {
    type: CREATE_CONN,
    connection,
  }
}

export const addOffer: ActionCreator<AddOffer> = (offer: RTCSessionDescriptionInit) => ({
  type: ADD_OFFER,
  offer,
})

export const addAnswer: ActionCreator<AddAnswer> = (answer: RTCSessionDescriptionInit) => ({
  type: ADD_ANSWER,
  answer,
})
