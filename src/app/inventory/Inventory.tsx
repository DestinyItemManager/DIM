import React from 'react';
import { DestinyAccount } from '../accounts/destiny-account';
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

interface Props {
  account: DestinyAccount;
}

export default function Inventory({ account }: Props) {
  return (
    <ErrorBoundary name="Inventory">
      <Stores />
      <LoadoutDrawer />
      <Compare />
      <StackableDragHelp />
      <DragPerformanceFix />
      {account.destinyVersion === 1 ? <D1Farming /> : <D2Farming />}
      {account.destinyVersion === 2 && <GearPower />}
      <DragGhostItem />
      <InfusionFinder destinyVersion={account.destinyVersion} />
      <ClearNewItems account={account} />
    </ErrorBoundary>
  );
}
