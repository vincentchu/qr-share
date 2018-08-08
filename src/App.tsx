import * as React from 'react'
import { connect, DispatchProp } from 'react-redux'

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
