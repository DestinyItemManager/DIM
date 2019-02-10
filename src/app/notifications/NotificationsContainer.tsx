import * as React from 'react';
import { Notify, notifications$ } from './notifications';
import Notification from './Notification';
import { Subscriptions } from '../rx-utils';
import './NotificationsContainer.scss';
import { Transition, animated, config } from 'react-spring';

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
    return (
      <div className="notifications-container">
        <Transition
          native={true}
          items={notifications}
          config={spring}
          keys={(item) => item.id}
          from={{ transform: 'translateX(350px)', height: 0 }}
          enter={[{ height: 'auto' }, { transform: 'translateX(0px)' }]}
          leave={[{ transform: 'translateX(350px)' }, { height: 0 }]}
        >
          {(notification) => (props) => (
            <animated.div key={notification.id} className="notification" style={props}>
              <Notification notification={notification} onClose={this.onNotificationClosed} />
            </animated.div>
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
