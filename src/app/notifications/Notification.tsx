import React from 'react';
import { Notify } from './notifications';
import clsx from 'clsx';
import './Notification.scss';
import { animated, Spring, config } from 'react-spring';

interface Props {
  notification: Notify;
  style: React.CSSProperties;
  onClose(notification: Notify): void;
}

interface State {
  mouseover: boolean;
  success?: boolean;
  error?: Error;
}

export default class Notification extends React.Component<Props, State> {
  state: State = { mouseover: false };
  private timer = 0;

  componentDidMount() {
    this.setupTimer();
  }

  componentDidUpdate(_: Props, prevState: State) {
    if ((!prevState.error && this.state.error) || (!prevState.success && this.state.success)) {
      this.setupTimer();
    }
  }

  componentWillUnmount() {
    window.clearTimeout(this.timer);
    this.timer = 0;
  }

  render() {
    const { notification, style } = this.props;
    const { mouseover, error, success } = this.state;

    return (
      <animated.div
        className="notification"
        role="alert"
        onClick={this.onClick}
        style={style}
        onMouseOver={this.onMouseOver}
        onMouseOut={this.onMouseOut}
        onTouchStart={this.onMouseOver}
      >
        <div
          className={clsx(
            'notification-inner',
            `notification-${error ? 'error' : success ? 'success' : notification.type}`
          )}
        >
          <div className="notification-contents">
            {notification.icon && <div className="notification-icon">{notification.icon}</div>}
            <div className="notification-details">
              <div className="notification-title">{notification.title}</div>
              {error ? (
                <div className="notification-body">{error.message}</div>
              ) : (
                notification.body && <div className="notification-body">{notification.body}</div>
              )}
            </div>
            {notification.trailer && (
              <div className="notification-trailer">{notification.trailer}</div>
            )}
          </div>
          {(success || error || !notification.promise) &&
            typeof notification.duration === 'number' && (
              <Spring
                from={{ width: '0%' }}
                to={{ width: mouseover ? '0%' : '100%' }}
                config={
                  mouseover
                    ? config.default
                    : { ...config.default, duration: notification.duration }
                }
              >
                {(props) => <animated.div style={props} className="notification-timer" />}
              </Spring>
            )}
        </div>
      </animated.div>
    );
  }

  private onClick = (event: React.MouseEvent) => {
    this.props.notification.onClick && this.props.notification.onClick(event);
    this.props.onClose(this.props.notification);
  };

  private onMouseOver = () => {
    window.clearTimeout(this.timer);
    this.timer = 0;
    this.setState({ mouseover: true });
  };

  private onMouseOut = () => {
    this.setState({ mouseover: false });
    this.setupTimer();
  };

  private setupTimer = () => {
    const { notification, onClose } = this.props;
    const { error, success } = this.state;

    if (!error && !success && notification.promise) {
      notification.promise
        .then(() => this.setState({ success: true }))
        .catch((error) => this.setState({ error }));
    } else {
      this.timer = window.setTimeout(
        () => {
          if (!this.state.mouseover) {
            onClose(notification);
          }
        },
        error ? 5000 : notification.duration
      );
    }
  };
}
