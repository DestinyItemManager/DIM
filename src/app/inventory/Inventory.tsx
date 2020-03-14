import React from 'react';
import { DestinyAccount } from '../accounts/destiny-account';
import { Loading } from '../dim-ui/Loading';
import Stores from './Stores';
import { D1StoresService } from './d1-stores';
import { D2StoresService } from './d2-stores';
import { connect } from 'react-redux';
import { RootState } from '../store/reducers';
import ClearNewItems from './ClearNewItems';
import StackableDragHelp from './StackableDragHelp';
import LoadoutDrawer from '../loadout/LoadoutDrawer';
import { Subscriptions } from '../utils/rx-utils';
import { refresh$ } from '../shell/refresh';
import Compare from '../compare/Compare';
import D2Farming from '../farming/D2Farming';
import D1Farming from '../farming/D1Farming';
import InfusionFinder from '../infuse/InfusionFinder';
import { queueAction } from './action-queue';
import ErrorBoundary from 'app/dim-ui/ErrorBoundary';
import DragPerformanceFix from 'app/inventory/DragPerformanceFix';

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
      queueAction(() => storesService.reloadStores());
    }

    this.subscriptions.add(
      refresh$.subscribe(() => queueAction(() => storesService.reloadStores()))
    );
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
      <ErrorBoundary name="Inventory">
        <Stores />
        <LoadoutDrawer />
        <Compare />
        <StackableDragHelp />
        <DragPerformanceFix />
        {account.destinyVersion === 1 ? <D1Farming /> : <D2Farming />}
        <InfusionFinder destinyVersion={account.destinyVersion} />
        <ClearNewItems account={account} />
      </ErrorBoundary>
    );
  }
}

export default connect(mapStateToProps)(Inventory);
