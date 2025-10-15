import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { currenciesSelector, storesSelector } from 'app/inventory/selectors';
import { useLoadStores } from 'app/inventory/store/hooks';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { compareBy } from 'app/utils/comparators';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { DestinyAccount } from '../../accounts/destiny-account';
import { D1Store } from '../../inventory/store-types';
import D1Vendor from './D1Vendor';
import * as styles from './D1Vendors.m.scss';
import { Vendor, countCurrencies, loadVendors } from './vendor.service';

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

  const storesLoaded = useLoadStores(account);

  useEffect(() => {
    (async () => {
      if (stores.length) {
        const vendors = await dispatch(loadVendors());
        setVendors(vendors);
      }
    })();
  }, [stores.length, dispatch]);

  if (!vendors || !storesLoaded) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  const totalCoins = countCurrencies(stores, vendors, currencies);
  const sortedVendors = Object.values(vendors).sort(compareBy((v) => v.vendorOrder));

  return (
    <div className={styles.vendors}>
      {sortedVendors.map((vendor) => (
        <D1Vendor key={vendor.hash} vendor={vendor} totalCoins={totalCoins} />
      ))}
    </div>
  );
}
