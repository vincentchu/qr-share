import * as React from 'react'
import { connect, DispatchProp } from 'react-redux'

import { createConnection } from './state/connection'

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
    this.props.dispatch(createConnection())
  }

  render() {
    return (
      <div>
        { this.props.children }
      </div>
    )
  }
}

export default connect()(App)
