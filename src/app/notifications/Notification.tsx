import * as React from 'react';
import { Notify } from './notifications';
import './Notification.scss';

interface Props {
  notification: Notify;
  onClose(notification: Notify): void;
}

export default class Notification extends React.Component<Props> {
  componentDidMount() {
    const { notification, onClose } = this.props;
    const promise =
      typeof notification.duration === 'number'
        ? timerPromise(notification.duration)
        : notification.duration;
    promise.then(() => onClose(notification));
  }

  render() {
    const { notification } = this.props;
    return (
      <div onClick={this.close}>
        <div className="notification-title">{notification.title}</div>
        <div className="notification-body">{notification.body}</div>
      </div>
    );
  }

  private close = () => {
    this.props.onClose(this.props.notification);
  };
}

function timerPromise(duration: number) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}
