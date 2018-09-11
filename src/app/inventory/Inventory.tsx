import * as React from 'react';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { $rootScope } from 'ngimport';
import { Loading } from '../dim-ui/Loading';
import Stores from './Stores';
import { D1StoresService } from './d1-stores.service';
import { D2StoresService } from './d2-stores.service';
import { connect } from 'react-redux';
import { RootState } from '../store/reducers';
import RandomLoadoutButton from '../loadout/random/RandomLoadoutButton';
import { angular2react } from 'angular2react';
import { FarmingComponent } from '../farming/farming.component';
import { D2FarmingComponent } from '../farming/d2farming.component';
import { lazyInjector } from '../../lazyInjector';
import { LoadoutDrawerComponent } from '../loadout/loadout-drawer.component';
import { CompareComponent } from '../compare/compare.component';
import { DimStore } from './store-types';
import ClearNewItems from './ClearNewItems';
import StackableDragHelp from './StackableDragHelp';

const D1Farming = angular2react('dimFarming', FarmingComponent, lazyInjector.$injector as angular.auto.IInjectorService);
const D2Farming = angular2react('d2Farming', D2FarmingComponent, lazyInjector.$injector as angular.auto.IInjectorService);
const LoadoutDrawer = angular2react<{
  stores: DimStore[];
  account: DestinyAccount;
}>('loadoutDrawer', LoadoutDrawerComponent, lazyInjector.$injector as angular.auto.IInjectorService);
const Compare = angular2react('dimCompare', CompareComponent, lazyInjector.$injector as angular.auto.IInjectorService);

interface Props {
  account: DestinyAccount;
  storesLoaded: boolean;
  stores: DimStore[];
}

function mapStateToProps(state: RootState): Partial<Props> {
  return {
    storesLoaded: state.inventory.stores.length > 0,
    stores: state.inventory.stores
  };
}

class Inventory extends React.Component<Props> {
  private $scope = $rootScope.$new(true);

  constructor(props) {
    super(props);
  }

  componentDidMount() {
    // TODO: Dispatch an action to load stores
    this.props.account.destinyVersion === 1
      ? D1StoresService.getStoresStream(this.props.account)
      : D2StoresService.getStoresStream(this.props.account);

    this.$scope.$on('dim-refresh', () => {
      this.props.account.destinyVersion === 1
        ? D1StoresService.reloadStores()
        : D2StoresService.reloadStores();
    });
  }

  componentWillUnmount() {
    this.$scope.$destroy();
  }

  render() {
    const { storesLoaded, account, stores } = this.props;

    if (!storesLoaded) {
      return <Loading />;
    }

    return (
      <>
        <Stores />
        <LoadoutDrawer stores={stores} account={account}/>
        <Compare/>
        <StackableDragHelp />
        {account.destinyVersion === 1 ? <D1Farming/> : <D2Farming/>}
        <ClearNewItems account={account}/>
        <RandomLoadoutButton destinyVersion={account.destinyVersion}/>
      </>
    );
  }
}

export default connect(mapStateToProps)(Inventory);
