import * as React from 'react';
import { t } from 'i18next';

interface Props {
  endTime: Date;
}

interface State {
  diff: number;
}

export default class Countdown extends React.Component<Props, State> {
  static getDerivedStateFromProps(props: Props) {
    const diff = props.endTime.getTime() - Date.now();
    return { diff };
  }

  private interval: number;

  constructor(props: Props) {
    super(props);
    this.state = { diff: 0 };
  }

  componentDidMount() {
    // Update once a minute
    this.interval = window.setInterval(this.update, 60000);
    this.update();
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    return (
      <span className="countdown" title={this.props.endTime.toLocaleString()}>
        {dhms(this.state.diff / 1000)}
      </span>
    );
  }

  private update = () => {
    const diff = this.props.endTime.getTime() - Date.now();
    this.setState({ diff });
    if (diff <= 0) {
      clearInterval(this.interval);
    }
  };
}

function pad(n: number, width: number) {
  const s = String(n);
  return s.length >= width ? s : new Array(width - s.length + 1).join('0') + s;
}

function dhms(secs: number) {
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
