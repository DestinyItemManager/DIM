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
        {dhm(this.state.diff / 1000, this.props.compact)}
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

function dhm(seconds: number, compact = false) {
  seconds = Math.max(0, seconds);
  const days = Math.floor(seconds / 86400);
  seconds %= 86400; // seconds with full days taken out
  const hours = Math.floor(seconds / 3600);
  seconds %= 3600; // seconds with full hours taken out
  const minutes = Math.floor(seconds / 60);
  const hhMM = `${hours}:${pad(minutes, 2)}`;
  const context = compact ? 'compact' : ''; // t('Countdown.Days_compact')
  return days ? `${t('Countdown.Days', { count: days, context })} ${hhMM}` : `${hhMM}`;
}
