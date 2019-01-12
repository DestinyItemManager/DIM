import * as React from 'react';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { Loading } from '../dim-ui/Loading';
import Stores from './Stores';
import { D1StoresService } from './d1-stores.service';
import { D2StoresService } from './d2-stores.service';
import { connect } from 'react-redux';
import { RootState } from '../store/reducers';
import { angular2react } from 'angular2react';
import { FarmingComponent } from '../farming/farming.component';
import { D2FarmingComponent } from '../farming/d2farming.component';
import { lazyInjector } from '../../lazyInjector';
import ClearNewItems from './ClearNewItems';
import StackableDragHelp from './StackableDragHelp';
import LoadoutDrawer from '../loadout/LoadoutDrawer';
import { Subscriptions } from '../rx-utils';
import { refresh$ } from '../shell/refresh';
import Compare from '../compare/Compare';

const D1Farming = angular2react(
  'dimFarming',
  FarmingComponent,
  lazyInjector.$injector as angular.auto.IInjectorService
);
const D2Farming = angular2react(
  'd2Farming',
  D2FarmingComponent,
  lazyInjector.$injector as angular.auto.IInjectorService
);

interface Props {
  account: DestinyAccount;
  storesLoaded: boolean;
}

function mapStateToProps(state: RootState): Partial<Props> {
  return {
    storesLoaded: state.inventory.stores.length > 0
  };
}

function getStoresService(account: DestinyAccount) {
  return account.destinyVersion === 1 ? D1StoresService : D2StoresService;
}

class Inventory extends React.Component<Props> {
  private subscriptions = new Subscriptions();

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    const storesService = getStoresService(this.props.account);

    // TODO: Dispatch an action to load stores
    storesService.getStoresStream(this.props.account);

    if (storesService.getStores().length && !this.props.storesLoaded) {
      // TODO: Don't really have to fully reload!
      storesService.reloadStores();
    }

    this.subscriptions.add(refresh$.subscribe(() => storesService.reloadStores()));
  }

  componentWillUnmount() {
    this.subscriptions.unsubscribe();
  }

  render() {
    const { storesLoaded, account } = this.props;

    if (!storesLoaded) {
      return <Loading />;
    }

    return (
      <>
        <Stores />
        <LoadoutDrawer />
        <Compare />
        <StackableDragHelp />
        {account.destinyVersion === 1 ? <D1Farming /> : <D2Farming />}
        <ClearNewItems account={account} />
      </>
    );
  }
}

export default connect(mapStateToProps)(Inventory);
