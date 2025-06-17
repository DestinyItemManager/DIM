import { useEventBusListener } from 'app/utils/hooks';
import { AnimatePresence, Transition, Variants } from 'motion/react';
import { useCallback, useState } from 'react';
import Notification from './Notification';
import styles from './NotificationsContainer.m.scss';
import { Notify, notifications$ } from './notifications';

const spring: Transition<number> = { type: 'spring', bounce: 0, duration: 0.3 };

const animateVariants: Variants = {
  hidden: { opacity: 0, height: 0 },
  shown: { height: 'auto', opacity: 1 },
};

/** This is the root element that displays popup notifications. */
export default function NotificationsContainer() {
  const [notifications, setNotifications] = useState<Notify[]>([]);

  useEventBusListener(
    notifications$,
    useCallback((notification: Notify) => {
      setNotifications((notifications) => [...notifications, notification]);
    }, []),
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
            initial="hidden"
            animate="shown"
            exit="hidden"
            variants={animateVariants}
            notification={item}
            onClose={onNotificationClosed}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
