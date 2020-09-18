import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { currenciesSelector, storesSelector } from 'app/inventory/selectors';
import { useLoadStores } from 'app/inventory/store/hooks';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { DestinyAccount } from '../../accounts/destiny-account';
import { AccountCurrency, D1Store } from '../../inventory/store-types';
import D1Vendor from './D1Vendor';
import styles from './D1Vendors.m.scss';
import { countCurrencies, loadVendors, Vendor } from './vendor.service';

interface ProvidedProps {
  account: DestinyAccount;
}

interface StoreProps {
  stores: D1Store[];
  currencies: AccountCurrency[];
}

function mapStateToProps(state: RootState): StoreProps {
  return {
    stores: storesSelector(state) as D1Store[],
    currencies: currenciesSelector(state),
  };
}

type Props = ProvidedProps & StoreProps & ThunkDispatchProp;

/**
 * The "All Vendors" page for D1 that shows all the rotating vendors.
 */
function D1Vendors({ account, stores, currencies, dispatch }: Props) {
  const [vendors, setVendors] = useState<{
    [vendorHash: number]: Vendor;
  }>();

  useLoadStores(account, stores.length > 0);

  useEffect(() => {
    (async () => {
      const vendors = await dispatch(loadVendors());
      setVendors(vendors);
    })();
  }, [stores, dispatch]);

  if (!vendors || !stores.length) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  const totalCoins = countCurrencies(stores, vendors, currencies);
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

export default connect(mapStateToProps)(D1Vendors);
