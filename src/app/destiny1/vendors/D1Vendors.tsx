import React from 'react';
import { DestinyAccount } from '../../accounts/destiny-account';
import { Subscriptions } from '../../utils/rx-utils';
import { refresh$ } from '../../shell/refresh';
import { dimVendorService, Vendor } from './vendor.service';
import { D1Store } from '../../inventory/store-types';
import _ from 'lodash';
import D1Vendor from './D1Vendor';
import styles from './D1Vendors.m.scss';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';

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
export default class D1Vendors extends React.Component<Props, State> {
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
      return <ShowPageLoading message={t('Loading.Profile')} />;
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
      <div className={styles.vendors}>
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
