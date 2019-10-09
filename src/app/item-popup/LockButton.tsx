import React from 'react';
import { DimItem } from '../inventory/item-types';
import { t } from 'app/i18next-t';
import { inProgress } from './LockButton.m.scss';
import clsx from 'clsx';
import { lockIcon, unlockedIcon, starIcon, starOutlineIcon, AppIcon } from '../shell/icons';
import { setItemState as d1SetItemState } from '../bungie-api/destiny1-api';
import { setLockState as d2SetLockState } from '../bungie-api/destiny2-api';

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
        <AppIcon className={clsx({ [inProgress]: locking })} icon={icon} />
      </div>
    );
  }

  private lockUnlock = async () => {
    const { item, type } = this.props;
    const { locking } = this.state;
    if (locking) {
      return;
    }

    const store =
      item.owner === 'vault'
        ? item.getStoresService().getActiveStore()!
        : item.getStoresService().getStore(item.owner)!;

    this.setState({ locking: true });

    let state = false;
    if (type === 'lock') {
      state = !item.locked;
    } else if (type === 'track') {
      state = !item.tracked;
    }

    try {
      if (item.isDestiny2()) {
        await d2SetLockState(store, item, state);
        // TODO: this doesn't work in React land
        item.locked = state;
      } else if (item.isDestiny1()) {
        await d1SetItemState(item, store, state, type);
        if (type === 'lock') {
          item.locked = state;
        } else if (type === 'track') {
          item.tracked = state;
        }
      }
    } finally {
      this.setState({ locking: false });
    }
  };
}
