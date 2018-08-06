import * as React from 'react'
import { render } from 'react-dom'
import { Route } from 'react-router'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'

import store from './redux-store'
import App from './App'
import Chat from './views/Chat'

render(
  <Provider store={store}>
    <BrowserRouter>
      <App>
        <Chat />
      </App>
    </BrowserRouter>
  </Provider>,
  document.getElementById('root')
)