import * as React from 'react';
import { DestinyAccount } from '../accounts/destiny-account.service';
import './vendors.scss';
import '../d2-vendors/vendor.scss';
import { UIViewInjectedProps } from '@uirouter/react';
import { Loading } from '../dim-ui/Loading';
import { Subscriptions } from '../rx-utils';
import { refresh$ } from '../shell/refresh';
import { dimVendorService, Vendor } from './vendor.service';
import { D1Store } from '../inventory/store-types';
import * as _ from 'lodash';
import D1Vendor from './D1Vendor';

interface Props {
  account: DestinyAccount;
}

interface State {
  vendors?: {
    [vendorHash: number]: Vendor;
  };
  stores?: D1Store[];
}

/**
 * The "All Vendors" page for D1 that shows all the rotating vendors.
 */
export default class D1Vendors extends React.Component<Props & UIViewInjectedProps, State> {
  private subscriptions = new Subscriptions();

  constructor(props: Props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.subscriptions.add(
      refresh$.subscribe(() => {
        dimVendorService.reloadVendors();
      }),
      dimVendorService.getVendorsStream(this.props.account).subscribe(([stores, vendors]) => {
        this.setState({ stores, vendors });
        dimVendorService.requestRatings();
      })
    );
  }

  componentWillUnmount() {
    this.subscriptions.unsubscribe();
  }

  render() {
    const { stores, vendors } = this.state;

    if (!vendors || !stores) {
      return (
        <div className="vendor dim-page">
          <Loading />
        </div>
      );
    }

    const totalCoins = dimVendorService.countCurrencies(stores, vendors);
    const ownedItemHashes = new Set<number>();
    for (const store of stores) {
      for (const item of store.items) {
        ownedItemHashes.add(item.hash);
      }
    }
    const sortedVendors = _.sortBy(Object.values(vendors), (v) => v.vendorOrder);

    return (
      <div className="vendor dim-page d2-vendors d1-vendors">
        {sortedVendors.map((vendor) => (
          <D1Vendor
            key={vendor.hash}
            vendor={vendor}
            totalCoins={totalCoins}
            ownedItemHashes={ownedItemHashes}
          />
        ))}
      </div>
    );
  }
}
