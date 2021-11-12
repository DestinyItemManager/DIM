import { useEventBusListener } from 'app/utils/hooks';
import { AnimatePresence, Spring } from 'framer-motion';
import React, { useCallback, useState } from 'react';
import Notification from './Notification';
import { notifications$, Notify } from './notifications';
import styles from './NotificationsContainer.m.scss';

const spring: Spring = { type: 'spring', bounce: 0, duration: 0.3 };

/** This is the root element that displays popup notifications. */
export default function NotificationsContainer() {
  const [notifications, setNotifications] = useState<Notify[]>([]);

  useEventBusListener(
    notifications$,
    useCallback((notification: Notify) => {
      setNotifications((notifications) => [...notifications, notification]);
    }, [])
  );

  const onNotificationClosed = (notification: Notify) =>
    setNotifications((notifications) => notifications.filter((n) => n !== notification));

  return (
    <div className={styles.container}>
      <AnimatePresence>
        {notifications.map((item) => (
          <Notification
            key={item.id}
            transition={spring}
            initial={{ opacity: 0, height: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ opacity: 0, height: 0 }}
            notification={item}
            onClose={onNotificationClosed}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
