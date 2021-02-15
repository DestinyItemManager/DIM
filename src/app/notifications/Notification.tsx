import { CanceledError } from 'app/utils/cancel';
import clsx from 'clsx';
import { motion, MotionProps, Transition } from 'framer-motion';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import './Notification.scss';
import NotificationButton from './NotificationButton';
import { NotificationError, Notify } from './notifications';

interface Props extends MotionProps {
  notification: Notify;
  onClose(notification: Notify): void;
}

export default function Notification({ notification, onClose, ...animation }: Props) {
  const [mouseover, setMouseover] = useState(false);
  const [success, setSuccess] = useState<boolean | undefined>();
  const [error, setError] = useState<NotificationError | undefined>();

  const timer = useRef(0);

  const setupTimer = useCallback(() => {
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = 0;
    }
    if (!error && !success && notification.promise) {
      notification.promise
        .then(() => setSuccess(true))
        .catch((e) => (e instanceof CanceledError ? setSuccess(true) : setError(e)));
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

  const progressTarget =
    mouseover || Boolean(!error && !success && notification.promise) ? '0%' : '100%';

  const transition: Transition = mouseover
    ? {
        type: 'tween',
        ease: 'easeOut',
        duration: 0.3,
      }
    : {
        type: 'tween',
        ease: 'linear',
        duration: notification.duration / 1000 - 0.3,
      };

  // A NotificationError can override a lot of properties
  const title = error?.title || notification.title;
  const body = error?.body || error?.message || notification.body;
  const icon = error?.icon || notification.icon;
  const trailer = error?.trailer || notification.trailer;

  return (
    <motion.div
      className="notification"
      role="alert"
      onClick={onClick}
      {...animation}
      onHoverStart={onMouseOver}
      onHoverEnd={onMouseOut}
      onTapStart={onMouseOver}
    >
      <div
        className={clsx(
          'notification-inner',
          `notification-${error ? 'error' : success ? 'success' : notification.type}`
        )}
      >
        <div className="notification-contents">
          {icon && <div className="notification-icon">{icon}</div>}
          <div className="notification-details">
            <div className="notification-title">{title}</div>
            {body && <div className="notification-body">{body}</div>}
            {!error && notification.onCancel && (
              <NotificationButton onClick={notification.onCancel}>Cancel</NotificationButton>
            )}
          </div>
          {trailer && <div className="notification-trailer">{trailer}</div>}
        </div>
        {(success || error || !notification.promise) &&
          typeof notification.duration === 'number' && (
            <motion.div
              transition={transition}
              initial={{ width: '0%' }}
              animate={{ width: progressTarget }}
              className="notification-timer"
            />
          )}
      </div>
    </motion.div>
  );
}
