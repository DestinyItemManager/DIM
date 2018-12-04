import * as React from 'react';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { $rootScope } from 'ngimport';
import { hotkeys } from '../ngimport-more';
import { t } from 'i18next';
import { D2StoresService } from './d2-stores.service';
import { D1StoresService } from './d1-stores.service';
import { NewItemsService } from './store/new-items.service';
import './ClearNewItems.scss';
import { connect } from 'react-redux';
import { RootState } from '../store/reducers';

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
    showNewItems: state.settings.showNewItems,
    hasNewItems: state.inventory.newItems.size > 0
  };
}

class ClearNewItems extends React.Component<Props> {
  private $scope = $rootScope.$new(true);

  componentDidMount() {
    const scopedHotkeys = hotkeys.bindTo(this.$scope);

    scopedHotkeys.add({
      combo: ['x'],
      description: t('Hotkey.ClearNewItems'),
      callback: () => {
        this.clearNewItems();
      }
    });
  }

  componentWillUnmount() {
    this.$scope.$destroy();
  }

  render() {
    const { showNewItems, hasNewItems } = this.props;

    if (!showNewItems || !hasNewItems) {
      return null;
    }

    return (
      <div className="clear-new-items">
        <button onClick={this.clearNewItems} title={t('Hotkey.ClearNewItemsTitle')}>
          <div className="new-item" /> <span>{t('Hotkey.ClearNewItems')}</span>
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
