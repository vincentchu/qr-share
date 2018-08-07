import * as React from 'react'
import { render } from 'react-dom'
import { Route } from 'react-router'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'

import { newWebSocket } from './conn-utils'
import store from './redux-store'
import App from './App'
import Chat from './views/Chat'
import Receive from './views/Receive'

render(
  <Provider store={store}>
    <BrowserRouter>
      <App>
        <Route path="/" component={Chat} exact />
        <Route path="/recv/:id" component={Receive} />
      </App>
    </BrowserRouter>
  </Provider>,
  document.getElementById('root')
)

// @ts-ignore
window.testWebsocket = () => {
  console.log('Testing Websocket Infra')

  Promise.all([
    newWebSocket('ws://localhost:9090/ws?id=some-id&scope=0'),
    newWebSocket('ws://localhost:9090/ws?id=some-id&scope=1'),
  ]).then(([ws0, ws1]) => {
    ws0.onmessage = (mesg) => console.log('Offer  RECV:', mesg)
    ws1.onmessage = (mesg) => console.log('Answer RECV:', mesg)

    return Promise.resolve(ws0.send('0 this-is-an-offer')).then(() => {
      return Promise.resolve(ws1.send('2')).then(() => {
        return Promise.resolve(ws1.send('1 this-is-an-answer'))
      })
    })
  })
}