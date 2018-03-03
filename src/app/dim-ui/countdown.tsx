import * as React from 'react';
import { t } from 'i18next';

interface Props {
  endTime: Date;
}

interface State {
  diff: number;
}

export default class Countdown extends React.Component<Props, State> {
  private interval: number;

  constructor(props) {
    super(props);
    this.state = { diff: 0 };
  }

  componentDidMount() {
    // Update once a minute
    this.interval = window.setInterval(this.update, 60000);
    this.update();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.endTime !== this.props.endTime) {
      clearInterval(this.interval);
      this.interval = window.setInterval(this.update, 60000);
      this.update();
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    return (
      <span title={this.props.endTime.toLocaleString()}>{dhms(this.state.diff / 1000)}</span>
    );
  }

  private update = () => {
    const diff = this.props.endTime.getTime() - Date.now();
    this.setState({ diff });
    if (diff <= 0) {
      clearInterval(this.interval);
    }
  }
}

function pad(n, width) {
  n = String(n);
  return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
}

function dhms(secs) {
  secs = Math.max(0, secs);

  const days = Math.floor(secs / 86400);
  secs -= days * 86400;
  const hours = Math.floor(secs / 3600) % 24;
  secs -= hours * 3600;
  const minutes = Math.floor(secs / 60) % 60;

  let text = `${hours}:${pad(minutes, 2)}`;
  if (days > 0) {
    text = `${t('Countdown.Days', { count: days })} ${text}`;
  }
  return text;
}
