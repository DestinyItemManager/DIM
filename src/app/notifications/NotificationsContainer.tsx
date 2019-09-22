import React from 'react';
import { Notify, notifications$ } from './notifications';
import Notification from './Notification';
import { Subscriptions } from '../utils/rx-utils';
import './NotificationsContainer.scss';
import { Transition, config } from 'react-spring';
import { isPhonePortrait } from '../utils/media-queries';

interface State {
  notifications: Notify[];
}

const spring = { ...config.stiff, precision: 0.1, clamp: true };

/** This is the root element that displays popup notifications. */
export default class NotificationsContainer extends React.Component<{}, State> {
  state: State = { notifications: [] };
  private subscriptions = new Subscriptions();

  componentDidMount() {
    this.subscriptions.add(
      notifications$.subscribe((notification: Notify) => {
        this.setState((state) => ({ notifications: [...state.notifications, notification] }));
      })
    );
  }

  componentWillUnmount() {
    this.subscriptions.unsubscribe();
  }

  render() {
    const { notifications } = this.state;

    const offScreen = isPhonePortrait() ? window.innerWidth : 360;

    return (
      <div className="notifications-container">
        <Transition
          native={true}
          items={notifications}
          config={spring}
          keys={(item) => item.id}
          from={{ transform: `translateX(${offScreen}px)`, height: 0 }}
          enter={[{ height: 'auto' }, { transform: 'translateX(0px)' }]}
          leave={[{ transform: `translateX(${offScreen}px)` }, { height: 0 }]}
        >
          {(notification) => (props) => (
            <Notification
              key={notification.id}
              style={props}
              notification={notification}
              onClose={this.onNotificationClosed}
            />
          )}
        </Transition>
      </div>
    );
  }

  private onNotificationClosed = (notification: Notify) => {
    this.setState((state) => ({
      notifications: state.notifications.filter((n) => n !== notification)
    }));
  };
}
