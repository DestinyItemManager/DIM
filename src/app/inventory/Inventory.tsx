import InventoryToggle from 'app/active-mode/InventoryToggle';
import StoresAlt from 'app/active-mode/StoresAlt';
import ErrorBoundary from 'app/dim-ui/ErrorBoundary';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import Farming from 'app/farming/Farming';
import { t } from 'app/i18next-t';
import DragPerformanceFix from 'app/inventory/DragPerformanceFix';
import Stores from 'app/inventory/Stores';
import MobileInspect from 'app/mobile-inspect/MobileInspect';
import { isPhonePortraitSelector } from 'app/shell/selectors';
import { RootState } from 'app/store/types';
import React, { useState } from 'react';
import { connect } from 'react-redux';
import { DestinyAccount } from '../accounts/destiny-account';
import Compare from '../compare/Compare';
import GearPower from '../gear-power/GearPower';
import InfusionFinder from '../infuse/InfusionFinder';
import LoadoutDrawer from '../loadout/LoadoutDrawer';
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

  const [altMode, setAltMode] = useState(false);

  if (!storesLoaded) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  return (
    <ErrorBoundary name="Inventory">
      {$featureFlags.altInventoryMode && <InventoryToggle mode={altMode} onClick={setAltMode} />}
      {altMode ? <StoresAlt account={account} /> : <Stores />}
      <LoadoutDrawer />
      <Compare />
      {$featureFlags.moveAmounts && <StackableDragHelp />}
      <DragPerformanceFix />
      <Farming />
      {account.destinyVersion === 2 && <GearPower />}
      {$featureFlags.mobileInspect && isPhonePortrait && <MobileInspect />}
      <DragGhostItem />
      <InfusionFinder destinyVersion={account.destinyVersion} />
    </ErrorBoundary>
  );
}

export default connect<StoreProps>(mapStateToProps)(Inventory);
