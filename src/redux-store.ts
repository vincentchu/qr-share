import { createStore, combineReducers, applyMiddleware } from 'redux'
import { reducer as formReducer } from 'redux-form'
import logger from 'redux-logger'

import { reducer as uploaderReducer } from './state/uploader'
import { reducer as receiverReducer } from './state/receiver'

const reducer = combineReducers({
  form: formReducer,
  uploader: uploaderReducer,
  receiver: receiverReducer,
})

const store = createStore(reducer, applyMiddleware(logger))

export default store