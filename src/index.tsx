import * as React from 'react'
import { render } from 'react-dom'
import { Route } from 'react-router'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'

import VideoPlayer from './views/VideoPlayer'

render(
  <div>
    <h1>Hello, World</h1>
    <VideoPlayer />
  </div>,
  document.getElementById('root')
)