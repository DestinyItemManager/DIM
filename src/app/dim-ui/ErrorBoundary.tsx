import React from 'react';
import { reportException } from '../utils/exceptions';
import ErrorPanel from 'app/shell/ErrorPanel';

interface Props {
  name: string;
}

interface State {
  error?: Error;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidCatch(error: Error, errorInfo) {
    this.setState({ error });
    console.error(error, errorInfo);
    reportException(this.props.name, error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return <ErrorPanel error={this.state.error} />;
    }
    return this.props.children;
  }
}
