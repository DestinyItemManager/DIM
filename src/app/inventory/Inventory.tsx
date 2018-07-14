import * as React from 'react';
import { DestinyAccount } from '../accounts/destiny-account.service';
import { $rootScope } from 'ngimport';
import { Loading } from '../dim-ui/Loading';
import Stores from './Stores';
import { D1StoresService } from './d1-stores.service';
import { D2StoresService } from './d2-stores.service';
import { connect } from 'react-redux';
import { RootState } from '../store/reducers';

interface Props {
  account: DestinyAccount;
  storesLoaded: boolean;
}

function mapStateToProps(state: RootState): Partial<Props> {
  console.log('mapStateToProps!!!', state);
  return {
    storesLoaded: state.inventory.stores.length > 0
  };
}

class Inventory extends React.Component<Props> {
  private $scope = $rootScope.$new(true);

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
    const { storesLoaded } = this.props;

    if (!storesLoaded) {
      return <Loading />;
    }

    // TODO: scroll-class
    /*
      <div className="sticky-header-background" scroll-className="something-is-sticky"/>
      <loadout-drawer stores="$ctrl.stores" account="$ctrl.account"></loadout-drawer>
      <dim-compare></dim-compare>
      <dim-item-discuss></dim-item-discuss>
      <div id="drag-help" className="drag-help drag-help-hidden" ng-i18next="Help.Drag"></div>
      <d2-farming></d2-farming>
      <dim-clear-new-items account="$ctrl.account"></dim-clear-new-items>
      <random-loadout stores="$ctrl.stores"></random-loadout>
    */
    return (
      <>
        <div className="sticky-header-background" />
        <Stores />
      </>
    );
  }
}

export default connect(mapStateToProps)(Inventory);
