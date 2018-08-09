import { createStore, combineReducers, applyMiddleware } from 'redux'
import { reducer as formReducer } from 'redux-form'
import logger from 'redux-logger'

import { reducer as uploaderReducer } from './state/uploader'

const reducer = combineReducers({
  form: formReducer,
  uploader: uploaderReducer,
})

const store = createStore(reducer, applyMiddleware(logger))

export default store