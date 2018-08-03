import * as React from 'react'

type VideoPlayerState = {
  stream?: MediaStream
}

const Constraints = {
  audio: false,
  video: true,
}

class VideoPlayer extends React.Component<{}, VideoPlayerState> {
  constructor(props: {}) {
    super(props)
    this.state = {}
  }

  componentWillMount() {
    window.navigator.mediaDevices.getUserMedia(Constraints)
      .then(this.onSuccess)
      .catch(this.onError)
  }

  onSuccess = (stream: MediaStream) => this.setState({ stream })

  onError = (error: Error) => console.log('Got Error: ', error, error.message)

  onRef = (ref: any) => {
    ref.srcObject = this.state.stream
  }

  render() {
    const { stream } = this.state
    return (
      <div id="video-player">
        { stream && <video ref={this.onRef} autoPlay controls /> }
      </div>
    )
  }
}

export default VideoPlayer