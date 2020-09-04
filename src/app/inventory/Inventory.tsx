import React from 'react';
import Stores from './Stores';
import ClearNewItems from './ClearNewItems';
import StackableDragHelp from './StackableDragHelp';
import LoadoutDrawer from '../loadout/LoadoutDrawer';
import Compare from '../compare/Compare';
import D2Farming from '../farming/D2Farming';
import D1Farming from '../farming/D1Farming';
import InfusionFinder from '../infuse/InfusionFinder';
import GearPower from '../gear-power/GearPower';
import ErrorBoundary from 'app/dim-ui/ErrorBoundary';
import DragPerformanceFix from 'app/inventory/DragPerformanceFix';
import DragGhostItem from './DragGhostItem';
import MobileInspect from 'app/mobile-inspect/MobileInspect';
import { DestinyComponentType } from 'bungie-api-ts/destiny2';
import withStoresLoader from 'app/utils/withStoresLoader';
import type { StoresLoadedProps } from 'app/utils/withStoresLoader';

type Props = StoresLoadedProps;

const storeComponents = [
  DestinyComponentType.ProfileInventories,
  DestinyComponentType.ProfileCurrencies,
  DestinyComponentType.Characters,
  DestinyComponentType.CharacterInventories,
  DestinyComponentType.CharacterEquipment,
  DestinyComponentType.ItemInstances,
];

function Inventory({ account, destinyVersion, isPhonePortrait }: Props) {
  return (
    <ErrorBoundary name="Inventory">
      <Stores />
      <LoadoutDrawer />
      <Compare />
      <StackableDragHelp />
      <DragPerformanceFix />
      {destinyVersion === 1 ? <D1Farming /> : <D2Farming />}
      {destinyVersion === 2 && <GearPower />}
      {$featureFlags.mobileInspect && isPhonePortrait && <MobileInspect />}
      <DragGhostItem />
      <InfusionFinder destinyVersion={destinyVersion} />
      <ClearNewItems account={account} />
    </ErrorBoundary>
  );
}

export default withStoresLoader(Inventory, storeComponents);
