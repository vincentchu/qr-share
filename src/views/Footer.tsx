import * as React from 'react'

const Footer: React.SFC<{}> = () => (
  <div className="block block-bordered text-center">
    <div className="container-fluid">
      <blockquote className="pull-quote">
        <p>
          Made with 🙌 by <a href="https://twitter.com/vincentchu">@vincentchu</a>.
          </p>
          <p>
            QQSend uses WebRTC and websockets. Read the <a href="https://github.com/vincentchu/qr-share">code</a>.
        </p>
      </blockquote>
    </div>
  </div>
)

export default Footer