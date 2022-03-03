import { DestinyAccount } from 'app/accounts/destiny-account';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { currenciesSelector, storesSelector } from 'app/inventory/selectors';
import { D1Store } from 'app/inventory/store-types';
import { useLoadStores } from 'app/inventory/store/hooks';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import D1Vendor from './D1Vendor';
import styles from './D1Vendors.m.scss';
import { countCurrencies, loadVendors, Vendor } from './vendor.service';

/**
 * The "All Vendors" page for D1 that shows all the rotating vendors.
 */
export default function D1Vendors({ account }: { account: DestinyAccount }) {
  const dispatch = useThunkDispatch();
  const stores = useSelector(storesSelector) as D1Store[];
  const currencies = useSelector(currenciesSelector);

  const [vendors, setVendors] = useState<{
    [vendorHash: number]: Vendor;
  }>();

  useLoadStores(account);

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
  const sortedVendors = _.sortBy(Object.values(vendors), (v) => v.vendorOrder);

  return (
    <div className={styles.vendors}>
      {sortedVendors.map((vendor) => (
        <D1Vendor key={vendor.hash} vendor={vendor} totalCoins={totalCoins} />
      ))}
    </div>
  );
}
