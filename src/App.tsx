import * as React from 'react'
import { connect, DispatchProp } from 'react-redux'
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap'

import  './scss/qr-share.scss'

// @ts-ignore
window.isModern = (!!window['RTCPeerConnection'] && !!window['WebSocket'])

type WarningProps = {
  isOpen: boolean
  toggle: () => void
}

const Warning: React.SFC<WarningProps> = (props) => (
  <Modal isOpen={props.isOpen} onClick={props.toggle} centered>
    <ModalHeader>
      😢
    </ModalHeader>
    <ModalBody>
      QQSend requires a modern browser to support device-to-device file sending via WebRTC and Websockets.
      You might try <a href="https://www.google.com/chrome/">Chrome</a> or updating your iOS operating system.
    </ModalBody>
    <ModalFooter>
      <Button color="danger" onClick={props.toggle}>
        I get it. I have an old browser.
      </Button>
    </ModalFooter>
  </Modal>
)

type AppProps = {
  children?: any
} & DispatchProp

type AppState = {
  showWarning: boolean
}

class App extends React.Component<AppProps, AppState> {
  constructor(props: AppProps) {
    super(props)
    this.state = { showWarning: !window.isModern }
  }

  componentWillMount() {
    console.log('componentWillMount')
  }

  toggleWarning = () => this.setState({ showWarning: !this.state.showWarning })

  render() {
    return (
      <div className="container-fluid">
        <Warning isOpen={this.state.showWarning} toggle={this.toggleWarning} />
        { this.props.children }
      </div>
    )
  }
}

export default connect()(App)
