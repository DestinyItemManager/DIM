import * as React from 'react';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { $rootScope } from 'ngimport';
import { hotkeys } from '../ngimport-more';
import { t } from 'i18next';
import { D2StoresService } from './d2-stores.service';
import { D1StoresService } from './d1-stores.service';
import { NewItemsService } from './store/new-items.service';
import { settings } from '../settings/settings';
import { Subscription } from 'rxjs/Subscription';
import './ClearNewItems.scss';

interface Props {
  account: DestinyAccount;
}

interface State {
  showNewItems: boolean;
  hasNewItems: boolean;
}

export default class ClearNewItems extends React.Component<Props, State> {
  private $scope = $rootScope.$new(true);
  private subscriptions: Subscription[] = [];

  // TODO: need two observables, settings and item service

  constructor(props) {
    super(props);
    this.state = {
      showNewItems: settings.showNewItems,
      hasNewItems: NewItemsService.hasNewItems
    };
  }

  componentDidMount() {
    const scopedHotkeys = hotkeys.bindTo(this.$scope);

    scopedHotkeys.add({
      combo: ["x"],
      description: t("Hotkey.ClearNewItems"),
      callback: () => {
        this.clearNewItems();
      }
    });

    this.subscriptions = [
      settings.$updates.subscribe(() => {
        if (this.state.showNewItems !== settings.showNewItems) {
          this.setState({ showNewItems: settings.showNewItems });
        }
      }),
      NewItemsService.$hasNewItems.subscribe((hasNewItems) => {
        this.setState({ hasNewItems });
      })
    ];
  }

  componentWillUnmount() {
    this.$scope.$destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.subscriptions = [];
  }

  render() {
    const { showNewItems, hasNewItems } = this.state;

    if (!showNewItems || !hasNewItems) {
      return null;
    }

    return (
      <div className="clear-new-items">
        <button onClick={this.clearNewItems} title={t("Hotkey.ClearNewItemsTitle")}>
          <i className="fa fa-thumbs-up"/> <span>{t("Hotkey.ClearNewItems")}</span>
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
  }
}
