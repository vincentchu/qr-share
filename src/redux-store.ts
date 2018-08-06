import { createStore, combineReducers, applyMiddleware } from 'redux'
import { reducer as formReducer } from 'redux-form'
import logger from 'redux-logger'

import { reducer as connectionReducer } from './state/connection'

const reducer = combineReducers({
  form: formReducer,
  connection: connectionReducer,
})

const store = createStore(reducer, applyMiddleware(logger))

export default store