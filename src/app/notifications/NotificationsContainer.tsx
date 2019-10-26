import React, { useState } from 'react';
import { Notify, notifications$ } from './notifications';
import Notification from './Notification';
import './NotificationsContainer.scss';
import { config, useTransition } from 'react-spring';
import { isPhonePortraitFromMediaQuery } from '../utils/media-queries';
import { useSubscription } from 'app/utils/hooks';

const spring = { ...config.stiff, precision: 0.1, clamp: true };

/** This is the root element that displays popup notifications. */
export default function NotificationsContainer() {
  const [notifications, setNotifications] = useState<Notify[]>([]);

  useSubscription(() =>
    notifications$.subscribe((notification: Notify) => {
      setNotifications((notifications) => [...notifications, notification]);
    })
  );

  const onNotificationClosed = (notification: Notify) =>
    setNotifications((notifications) => notifications.filter((n) => n !== notification));

  const offScreen = isPhonePortraitFromMediaQuery() ? window.innerWidth : 360;

  const transitions = useTransition(notifications, (n) => n.id, {
    config: spring,
    from: { transform: `translateX(${offScreen}px)`, height: 0 },
    enter: [{ height: 'auto' }, { transform: 'translateX(0px)' }],
    leave: [{ transform: `translateX(${offScreen}px)` }, { height: 0 }]
  });

  return (
    <div className="notifications-container">
      {transitions.map(({ item, key, props }) => (
        <Notification key={key} style={props} notification={item} onClose={onNotificationClosed} />
      ))}
    </div>
  );
}
