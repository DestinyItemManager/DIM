import React from 'react';
import { DestinyAccount } from '../accounts/destiny-account';
import { t } from 'app/i18next-t';
import { D2StoresService } from './d2-stores';
import { D1StoresService } from './d1-stores';
import { NewItemsService } from './store/new-items';
import './ClearNewItems.scss';
import { connect } from 'react-redux';
import { RootState } from '../store/reducers';
import GlobalHotkeys from '../hotkeys/GlobalHotkeys';
import NewItemIndicator from './NewItemIndicator';
import { settingsSelector } from 'app/settings/reducer';

interface ProvidedProps {
  account: DestinyAccount;
}

interface StoreProps {
  showNewItems: boolean;
  hasNewItems: boolean;
}

type Props = ProvidedProps & StoreProps;

function mapStateToProps(state: RootState): StoreProps {
  return {
    showNewItems: settingsSelector(state).showNewItems,
    hasNewItems: state.inventory.newItems.size > 0
  };
}

class ClearNewItems extends React.Component<Props> {
  render() {
    const { showNewItems, hasNewItems } = this.props;

    if (!showNewItems || !hasNewItems) {
      return null;
    }

    return (
      <div className="clear-new-items">
        <GlobalHotkeys
          hotkeys={[
            {
              combo: 'x',
              description: t('Hotkey.ClearNewItems'),
              callback: this.clearNewItems
            }
          ]}
        />
        <button onClick={this.clearNewItems} title={t('Hotkey.ClearNewItemsTitle')}>
          <NewItemIndicator className="new-item" /> <span>{t('Hotkey.ClearNewItems')}</span>
        </button>
      </div>
    );
  }

  private clearNewItems = () => {
    const stores = (this.props.account.destinyVersion === 2
      ? D2StoresService
      : D1StoresService
    ).getStores();
    NewItemsService.clearNewItems(stores, this.props.account);
  };
}

export default connect(mapStateToProps)(ClearNewItems);
