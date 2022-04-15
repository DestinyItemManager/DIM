import ErrorPanel from 'app/shell/ErrorPanel';
import { errorLog } from 'app/utils/log';
import React from 'react';
import { reportException } from '../utils/exceptions';

interface Props {
  name: string;
  children?: React.ReactNode | React.ReactNode[];
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
