import ErrorBoundary from 'app/dim-ui/ErrorBoundary';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import Farming from 'app/farming/Farming';
import { t } from 'app/i18next-t';
import DragPerformanceFix from 'app/inventory/DragPerformanceFix';
import MobileInspect from 'app/mobile-inspect/MobileInspect';
import { RootState } from 'app/store/types';
import React from 'react';
import { connect } from 'react-redux';
import { DestinyAccount } from '../accounts/destiny-account';
import Compare from '../compare/Compare';
import GearPower from '../gear-power/GearPower';
import InfusionFinder from '../infuse/InfusionFinder';
import LoadoutDrawer from '../loadout/LoadoutDrawer';
import ClearNewItems from './ClearNewItems';
import DragGhostItem from './DragGhostItem';
import { isPhonePortraitSelector, storesLoadedSelector } from './selectors';
import StackableDragHelp from './StackableDragHelp';
import { useLoadStores } from './store/hooks';
import Stores from './Stores';

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

function Inventory({ storesLoaded, account, isPhonePortrait }: Props) {
  useLoadStores(account, storesLoaded);

  if (!storesLoaded) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  return (
    <ErrorBoundary name="Inventory">
      <Stores />
      <LoadoutDrawer />
      <Compare />
      <StackableDragHelp />
      <DragPerformanceFix />
      <Farming />
      {account.destinyVersion === 2 && <GearPower />}
      {$featureFlags.mobileInspect && isPhonePortrait && <MobileInspect />}
      <DragGhostItem />
      <InfusionFinder destinyVersion={account.destinyVersion} />
      <ClearNewItems account={account} />
    </ErrorBoundary>
  );
}

export default connect<StoreProps>(mapStateToProps)(Inventory);
