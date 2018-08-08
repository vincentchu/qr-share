import * as React from 'react'
import { connect, DispatchProp } from 'react-redux'

import { createConnection } from './state/connection'
import HandshakeApi from './handshake-api'

type AppProps = {
  children?: any
} & DispatchProp

type AppState = {}

class App extends React.Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props)
    this.state = {}
  }

  componentWillMount() {
    console.log('componentWillMount')
    // this.props.dispatch(createConnection())
    const h = new HandshakeApi("ws://localhost:9090/ws?id=9999&scope=0")
    // @ts-ignore
    window.h = h
  }

  render() {
    return (
      <div>
        Foo
      </div>
    )
  }
}

export default connect()(App)
