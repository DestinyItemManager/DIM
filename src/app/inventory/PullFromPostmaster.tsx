import * as React from 'react';
import { D2Store } from './store-types';
import { pullablePostmasterItems, pullFromPostmaster } from '../loadout/postmaster';
import { queueAction } from './action-queue';
import { t } from 'i18next';
import { AppIcon, refreshIcon, sendIcon } from '../shell/icons';

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
      <div className="dim-button bucket-button" onClick={this.onClick}>
        <AppIcon spinning={working} icon={working ? refreshIcon : sendIcon} />{' '}
        <span className="badge">{numPullablePostmasterItems}</span>{' '}
        {t('Loadouts.PullFromPostmaster')}
      </div>
    );
  }

  // We need the Angular apply to drive the toaster, until Angular is gone
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
}
