import * as React from 'react'
import { DispatchProp } from 'react-redux';
import { Dispatch } from 'redux'

export type LoadingProps = {
  isLoading: boolean
}

const loadingComponent = <BaseProps extends DispatchProp>(
  loader: (dispatch: Dispatch, props: object) => Promise<any>,
  Base: React.ComponentType<BaseProps & LoadingProps>
) => (
  class LoadingComponent extends React.Component<BaseProps, LoadingProps> {
    constructor(props: BaseProps) {
      super(props)
      this.state = { isLoading: true }
    }

    componentWillMount() {
      loader(this.props.dispatch, this.props).then(() => this.setState({ isLoading: false }))
    }

    render() {
      return (
        <Base {...this.props} isLoading={this.state.isLoading} />
      )
    }
  }
)

export default loadingComponent
