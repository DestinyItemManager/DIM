import React from 'react';
import { t } from 'app/i18next-t';

interface Props {
  endTime: Date;
  compact?: boolean;
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
        {dhms(this.state.diff / 1000, this.props.compact)}
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

function dhms(secs: number, compact = false) {
  secs = Math.max(0, secs);
  const days = Math.floor(secs / 86400);
  const hours = Math.floor((secs % 86400) / 3600);
  const minutes = Math.floor(((secs % 86400) % 3600) / 60);
  const data = { count: days };
  const hhMM = `${hours}:${pad(minutes, 2)}`;
  return days > 0
    ? `${compact ? t('Countdown.DaysCompact', data) : t('Countdown.Days', data)} ${hhMM}`
    : `${hhMM}`;
}
