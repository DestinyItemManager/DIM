import { DestinyAccount } from 'app/accounts/destiny-account';
import ErrorBoundary from 'app/dim-ui/ErrorBoundary';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import GearPower from 'app/gear-power/GearPower';
import { t } from 'app/i18next-t';
import Stores from 'app/inventory-page/Stores';
import { storesLoadedSelector } from 'app/inventory/selectors';
import { useLoadStores } from 'app/inventory/store/hooks';
import DragPerformanceFix from 'app/item/DragPerformanceFix';
import { DestinyComponentType } from 'bungie-api-ts/destiny2';
import React from 'react';
import { useSelector } from 'react-redux';

interface Props {
  account: DestinyAccount;
}

const components = [
  DestinyComponentType.ProfileInventories,
  DestinyComponentType.ProfileCurrencies,
  DestinyComponentType.Characters,
  DestinyComponentType.CharacterInventories,
  DestinyComponentType.CharacterEquipment,
  DestinyComponentType.ItemInstances,
  // Without ItemSockets and ItemReusablePlugs there will be a delay before the thumbs ups.
  // One solution could be to cache the wishlist info between loads.
  DestinyComponentType.ItemSockets,
  DestinyComponentType.ItemReusablePlugs,
];

export default function Inventory({ account }: Props) {
  const storesLoaded = useSelector(storesLoadedSelector);
  useLoadStores(account, components);

  if (!storesLoaded) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  return (
    <ErrorBoundary name="Inventory">
      <Stores />
      <DragPerformanceFix />
      {account.destinyVersion === 2 && <GearPower />}
    </ErrorBoundary>
  );
}
