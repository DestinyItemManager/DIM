import React from 'react';
import { t } from 'app/i18next-t';
import { getItemInfoSource, TagValue } from '../inventory/dim-item-info';
import { DimItem } from '../inventory/item-types';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { showNotification } from '../notifications/notifications';
import './Notification.scss';

export type NotifButtonType = 'undo';

interface Props {
  type: NotifButtonType;
  account: DestinyAccount;
  effect: { item: DimItem; setTag: TagValue | 'clear' | 'lock' | 'unlock' }[];
}

interface State {
  buttonEnabled: boolean;
}
/**
 * NotificationButton is added by passing a NotifButtonType to a notification's `type`.
 * effect defined by buttonEffect, an array of {DimItem, setTag} showing what tag to apply where
 */
export default class NotificationButton extends React.Component<Props, State> {
  render() {
    return (
      <span className={this.props.type} onClick={this.onButtonClick}>
        {t('Filter.Undo')}
      </span>
    );
  }

  private onButtonClick = () => {
    this.setTags();
  };

  private async setTags() {
    const itemInfoService = await getItemInfoSource(this.props.account);
    itemInfoService.bulkSave(
      this.props.effect.map(({ item, setTag }) => {
        item.dimInfo.tag = setTag === 'clear' ? undefined : (setTag as TagValue);
        return item;
      })
    );

    showNotification({
      type: 'success',
      title: t('Header.BulkTag'),
      body: t('Filter.BulkRevert', { count: this.props.effect.length })
    });
  }
}
