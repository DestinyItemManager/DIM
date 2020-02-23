import React from 'react';
import { DimItem } from '../inventory/item-types';
import { t } from 'app/i18next-t';
import styles from './LockButton.m.scss';
import clsx from 'clsx';
import { lockIcon, unlockedIcon, starIcon, starOutlineIcon, AppIcon } from '../shell/icons';
import { setItemLockState } from 'app/inventory/item-move-service';

interface Props {
  item: DimItem;
  type: 'lock' | 'track';
}

interface State {
  locking: boolean;
}

export default class LockButton extends React.Component<Props, State> {
  state: State = { locking: false };

  render() {
    const { type, item } = this.props;
    const { locking } = this.state;

    const data = { itemType: item.typeName };

    const title =
      type === 'lock'
        ? !item.locked
          ? t('MovePopup.LockUnlock.Lock', data)
          : t('MovePopup.LockUnlock.Unlock', data)
        : !item.tracked
        ? t('MovePopup.TrackUntrack.Track', data)
        : t('MovePopup.TrackUntrack.Untrack', data);

    const icon =
      type === 'lock'
        ? item.locked
          ? lockIcon
          : unlockedIcon
        : item.tracked
        ? starIcon
        : starOutlineIcon;

    return (
      <div onClick={this.lockUnlock} title={title}>
        <AppIcon className={clsx({ [styles.inProgress]: locking })} icon={icon} />
      </div>
    );
  }

  private lockUnlock = async () => {
    const { item, type } = this.props;
    const { locking } = this.state;
    if (locking) {
      return;
    }

    this.setState({ locking: true });

    let state = false;
    if (type === 'lock') {
      state = !item.locked;
    } else if (type === 'track') {
      state = !item.tracked;
    }

    try {
      await setItemLockState(item, state, type);
      if (type === 'lock') {
        item.locked = state;
      } else if (type === 'track') {
        item.tracked = state;
      }
    } finally {
      this.setState({ locking: false });
    }
  };
}
