import ErrorBoundary from 'app/dim-ui/ErrorBoundary';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import DragPerformanceFix from 'app/inventory/DragPerformanceFix';
import Stores from 'app/inventory/Stores';
import MobileInspect from 'app/mobile-inspect/MobileInspect';
import { isPhonePortraitSelector } from 'app/shell/selectors';
import { RootState } from 'app/store/types';
import React from 'react';
import { connect } from 'react-redux';
import { DestinyAccount } from '../accounts/destiny-account';
import GearPower from '../gear-power/GearPower';
import DragGhostItem from './DragGhostItem';
import { storesLoadedSelector } from './selectors';
import StackableDragHelp from './StackableDragHelp';
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

/*
const components = [
  DestinyComponentType.ProfileInventories,
  DestinyComponentType.ProfileCurrencies,
  DestinyComponentType.Characters,
  DestinyComponentType.CharacterInventories,
  DestinyComponentType.CharacterEquipment,
  DestinyComponentType.ItemInstances,
  DestinyComponentType.ItemSockets, // TODO: remove ItemSockets - currently needed for wishlist perks
];
*/

function Inventory({ storesLoaded, account, isPhonePortrait }: Props) {
  useLoadStores(account, storesLoaded);

  if (!storesLoaded) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  return (
    <ErrorBoundary name="Inventory">
      <Stores account={account} />
      {$featureFlags.moveAmounts && <StackableDragHelp />}
      <DragPerformanceFix />
      {account.destinyVersion === 2 && <GearPower />}
      {$featureFlags.mobileInspect && isPhonePortrait && <MobileInspect />}
      <DragGhostItem />
    </ErrorBoundary>
  );
}

export default connect<StoreProps>(mapStateToProps)(Inventory);
