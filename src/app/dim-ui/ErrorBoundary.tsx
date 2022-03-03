import ErrorPanel from 'app/shell/ErrorPanel';
import { reportException } from 'app/utils/exceptions';
import { errorLog } from 'app/utils/log';
import React from 'react';

interface Props {
  name: string;
}

interface State {
  error?: Error;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  componentDidCatch(error: Error, errorInfo: any) {
    const { name } = this.props;

    this.setState({ error });
    errorLog(name, error, errorInfo);
    reportException(name, error, errorInfo);
  }

  render() {
    const { error } = this.state;
    const { children } = this.props;

    if (error) {
      return <ErrorPanel error={error} />;
    }
    return children;
  }
}
