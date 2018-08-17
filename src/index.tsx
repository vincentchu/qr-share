import * as React from 'react'
import { render } from 'react-dom'
import { Route } from 'react-router'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'

import store from './redux-store'
import App from './App'
import Send from './views/Send'
import Receive from './views/Receive'

declare global {
  interface Window {
    VERSION: string
    USERNAME: string
    PASSWORD: string
    isModern: boolean
  }
}

render(
  <Provider store={store}>
    <BrowserRouter>
      <App>
        <Route path="/" component={Send} exact />
        <Route path="/recv/:id" component={Receive} />
      </App>
    </BrowserRouter>
  </Provider>,
  document.getElementById('root')
)
