import { DestinyAccount } from 'app/accounts/destiny-account';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { storesLoadedSelector } from 'app/inventory/selectors';
import { useLoadStores } from 'app/inventory/store/hooks';
import React from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import Armory from './Armory';

// TODO: may need to be in account!
export default function ArmoryPage({
  account,
  itemHash,
}: {
  account: DestinyAccount;
  itemHash: number;
}) {
  const { search } = useLocation();
  const storesLoaded = useSelector(storesLoadedSelector);
  useLoadStores(account, storesLoaded);
  if (!storesLoaded) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  const searchParams = new URLSearchParams(search);
  const perksString = searchParams.get('perks') ?? '';
  const sockets = perksString.split(',').reduce((memo, n, i) => {
    const perkHash = parseInt(n, 10);
    if (perkHash !== 0) {
      memo[i] = perkHash;
    }
    return memo;
  }, {});

  return (
    <div className="dim-page">
      <Armory itemHash={itemHash} sockets={sockets} />
    </div>
  );
}
