import React from 'react';

interface Props {
  onClick(): void;
}

/**
 * an independent element fed into showNotification({body:
 * attach your own functionality to its onClick when creating it.
 * jsx children are the button's label
 */
export default class NotificationButton extends React.Component<Props> {
  render() {
    return (
      <span className="notif-button" onClick={this.props.onClick}>
        {this.props.children}
      </span>
    );
  }
}
