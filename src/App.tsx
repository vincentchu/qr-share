import * as React from 'react'
import { connect, DispatchProp } from 'react-redux'

import { generateKey, exportKey, importKey, encryptString, decryptstring } from './crypto-utils'
import  './scss/qr-share.scss'

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
      <div className="container-fluid">
        { this.props.children }
      </div>
    )
  }
}

export default connect()(App)

generateKey().then((key) => {
  console.log('KEY', key)
  return exportKey(key).then((keyStr) => {
    console.log('KEY STR!', keyStr)

    return importKey(keyStr).then((kkey) => {
      console.log('KKEY', kkey)
      console.log('EQAL', key == kkey)

      // @ts-ignore
      window.key = key

      // @ts-ignore
      window.kkey = kkey

      return [key, kkey]
    })
  })
}).then(([ k1, k2 ]) => {
  const iv = new Uint8Array(16)
  crypto.getRandomValues(iv)

  encryptString('hello, there', k1, iv).then((eStr) => {
    console.log('ENCRYPTED STR', eStr)

    return decryptstring(eStr, k2, iv).then((dStr) => {
      console.log('DECRYPTED', dStr)
    })
  })
})

