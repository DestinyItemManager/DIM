import ErrorBoundary from 'app/dim-ui/ErrorBoundary';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import DragPerformanceFix from 'app/inventory/DragPerformanceFix';
import MobileInspect from 'app/mobile-inspect/MobileInspect';
import { RootState } from 'app/store/types';
import { useSubscription } from 'app/utils/hooks';
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { DestinyAccount } from '../accounts/destiny-account';
import Compare from '../compare/Compare';
import D1Farming from '../farming/D1Farming';
import D2Farming from '../farming/D2Farming';
import GearPower from '../gear-power/GearPower';
import InfusionFinder from '../infuse/InfusionFinder';
import LoadoutDrawer from '../loadout/LoadoutDrawer';
import { refresh$ } from '../shell/refresh';
import { queueAction } from './action-queue';
import ClearNewItems from './ClearNewItems';
import { D1StoresService } from './d1-stores';
import { D2StoresService } from './d2-stores';
import DragGhostItem from './DragGhostItem';
import { isPhonePortraitSelector, storesLoadedSelector } from './selectors';
import StackableDragHelp from './StackableDragHelp';
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

function getStoresService(account: DestinyAccount) {
  return account.destinyVersion === 1 ? D1StoresService : D2StoresService;
}

function Inventory({ storesLoaded, account, isPhonePortrait }: Props) {
  useSubscription(() => {
    const storesService = getStoresService(account);
    return refresh$.subscribe(() => queueAction(() => storesService.reloadStores()));
  });

  useEffect(() => {
    const storesService = getStoresService(account);
    if (!storesLoaded) {
      // TODO: Dispatch an action to load stores instead
      storesService.getStoresStream(account);
    }
  }, [account, storesLoaded]);

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
      {account.destinyVersion === 1 ? <D1Farming /> : <D2Farming />}
      {account.destinyVersion === 2 && <GearPower />}
      {$featureFlags.mobileInspect && isPhonePortrait && <MobileInspect />}
      <DragGhostItem />
      <InfusionFinder destinyVersion={account.destinyVersion} />
      <ClearNewItems account={account} />
    </ErrorBoundary>
  );
}

export default connect<StoreProps>(mapStateToProps)(Inventory);
