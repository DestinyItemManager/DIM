import React from 'react';
import { t } from 'app/i18next-t';
import './Notification.scss';
import { AppIcon } from '../shell/icons';
import { faUndo } from '@fortawesome/free-solid-svg-icons';

type NotifButtonType = 'undo';

interface Props {
  type: NotifButtonType;
  onClick(): void;
}

/**
 * an independent element called directly by the script requesting a notification
 * and fed into showNotification({body:
 * contains just the DOM element and some reusable display verbiage
 * attach your own functionality to its onClick when creating it
 */
export default class NotificationButton extends React.Component<Props> {
  render() {
    return (
      <span className="notif-button" onClick={this.props.onClick}>
        <AppIcon icon={faUndo} title={t('Header.BulkTag')} />
        {t('Filter.Undo')}
      </span>
    );
  }
}
