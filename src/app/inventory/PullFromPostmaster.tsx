import React from 'react';
import { D2Store } from './store-types';
import { pullablePostmasterItems, pullFromPostmaster } from '../loadout/postmaster';
import { queueAction } from './action-queue';
import { t } from 'app/i18next-t';
import { AppIcon, refreshIcon, sendIcon } from '../shell/icons';
import idx from 'idx';

interface Props {
  store: D2Store;
}

interface State {
  working: boolean;
}

export class PullFromPostmaster extends React.Component<Props, State> {
  state: State = { working: false };

  render() {
    const { store } = this.props;
    const { working } = this.state;

    const numPullablePostmasterItems = pullablePostmasterItems(store).length;
    if (numPullablePostmasterItems === 0) {
      return null;
    }

    return (
      <div
        className="dim-button bucket-button"
        onClick={this.onClick}
        onMouseEnter={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}
      >
        <AppIcon spinning={working} icon={working ? refreshIcon : sendIcon} />{' '}
        <span className="badge">{numPullablePostmasterItems}</span>{' '}
        {t('Loadouts.PullFromPostmaster')}
      </div>
    );
  }

  private onClick = () => {
    queueAction(async () => {
      this.setState({ working: true });
      try {
        await pullFromPostmaster(this.props.store);
      } finally {
        this.setState({ working: false });
      }
    });
  };

  private onMouseEnter = () => {
    const pullableItems = pullablePostmasterItems(this.props.store);
    pullableItems.forEach((item) => {
      const element = idx(document.getElementById(item.index), (e) => e.parentNode) as HTMLElement;
      if (!element) {
        throw new Error(`No element with id ${item.index}`);
      }
      element.classList.add('item-postmaster-hover');
    });
  };

  private onMouseLeave = () => {
    [].forEach.call(document.querySelectorAll('.item-postmaster-hover'), (el) => {
      (el as HTMLElement).classList.remove('item-postmaster-hover');
    });
  };
}
