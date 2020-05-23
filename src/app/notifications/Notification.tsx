import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Notify } from './notifications';
import clsx from 'clsx';
import './Notification.scss';
import { animated, config, useSpring } from 'react-spring';

interface Props {
  notification: Notify;
  style: React.CSSProperties;
  onClose(notification: Notify): void;
}

export default function Notification({ notification, style, onClose }: Props) {
  const [mouseover, setMouseover] = useState(false);
  const [success, setSuccess] = useState<boolean | undefined>();
  const [error, setError] = useState<Error | undefined>();

  const timer = useRef(0);

  const setupTimer = useCallback(() => {
    if (!error && !success && notification.promise) {
      notification.promise.then(() => setSuccess(true)).catch(setError);
    } else if (notification.duration) {
      timer.current = window.setTimeout(
        () => {
          if (!mouseover) {
            onClose(notification);
          }
        },
        error ? 5000 : notification.duration
      );
    } else {
      window.setTimeout(() => onClose(notification), 0);
    }
  }, [error, success, notification, mouseover, onClose]);

  const clearTimer = () => {
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = 0;
    }
  };

  useEffect(() => {
    setupTimer();
    return clearTimer;
  }, [setupTimer]);

  const onClick = (event: React.MouseEvent) => {
    if (notification.onClick?.(event) !== false) {
      onClose(notification);
    }
  };

  const onMouseOver = () => {
    clearTimer();
    setMouseover(true);
  };

  const onMouseOut = () => {
    setMouseover(false);
    setupTimer();
  };

  const progressBarProps = useSpring({
    from: { width: '0%' },
    to: { width: mouseover || Boolean(!error && !success && notification.promise) ? '0%' : '100%' },
    config: mouseover ? config.default : { ...config.default, duration: notification.duration },
  });

  return (
    <animated.div
      className="notification"
      role="alert"
      onClick={onClick}
      style={style}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
      onTouchStart={onMouseOver}
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
            <animated.div style={progressBarProps} className="notification-timer" />
          )}
      </div>
    </animated.div>
  );
}
