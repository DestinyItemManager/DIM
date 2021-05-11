import ErrorBoundary from 'app/dim-ui/ErrorBoundary';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import DragPerformanceFix from 'app/inventory/DragPerformanceFix';
import Stores from 'app/inventory/Stores';
import MobileInspect from 'app/mobile-inspect/MobileInspect';
import { isPhonePortraitSelector } from 'app/shell/selectors';
import { RootState } from 'app/store/types';
import { DestinyComponentType } from 'bungie-api-ts/destiny2';
import React from 'react';
import { connect } from 'react-redux';
import { DestinyAccount } from '../accounts/destiny-account';
import GearPower from '../gear-power/GearPower';
import DragGhostItem from './DragGhostItem';
import { storesLoadedSelector } from './selectors';
import { useLoadStores } from './store/hooks';

interface ProvidedProps {
  account: DestinyAccount;
}

interface StoreProps {
  storesLoaded: boolean;
  isPhonePortrait: boolean;
}

type Props = ProvidedProps & StoreProps;

function mapStateToProps(state: RootState): StoreProps {
  return {
    storesLoaded: storesLoadedSelector(state),
    isPhonePortrait: isPhonePortraitSelector(state),
  };
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

function Inventory({ storesLoaded, account, isPhonePortrait }: Props) {
  useLoadStores(account, storesLoaded, components);

  if (!storesLoaded) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  return (
    <ErrorBoundary name="Inventory">
      <Stores account={account} />
      <DragPerformanceFix />
      {account.destinyVersion === 2 && <GearPower />}
      {$featureFlags.mobileInspect && isPhonePortrait && <MobileInspect />}
      <DragGhostItem />
    </ErrorBoundary>
  );
}

export default connect<StoreProps>(mapStateToProps)(Inventory);
