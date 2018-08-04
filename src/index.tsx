import * as React from 'react'
import { render } from 'react-dom'
import { Route } from 'react-router'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'

import VideoPlayer from './views/VideoPlayer'
import TextTransmit from './views/TextTransmit'

render(
  <div>
    <h1>Hello, World</h1>
    <TextTransmit />
  </div>,
  document.getElementById('root')
)