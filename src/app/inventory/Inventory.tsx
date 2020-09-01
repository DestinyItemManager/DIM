import React, { useEffect } from 'react';
import { DestinyAccount } from '../accounts/destiny-account';
import Stores from './Stores';
import { D1StoresService } from './d1-stores';
import { D2StoresService } from './d2-stores';
import { connect } from 'react-redux';
import { RootState } from 'app/store/types';
import ClearNewItems from './ClearNewItems';
import StackableDragHelp from './StackableDragHelp';
import LoadoutDrawer from '../loadout/LoadoutDrawer';
import { refresh$ } from '../shell/refresh';
import Compare from '../compare/Compare';
import D2Farming from '../farming/D2Farming';
import D1Farming from '../farming/D1Farming';
import InfusionFinder from '../infuse/InfusionFinder';
import GearPower from '../gear-power/GearPower';
import { queueAction } from './action-queue';
import ErrorBoundary from 'app/dim-ui/ErrorBoundary';
import DragPerformanceFix from 'app/inventory/DragPerformanceFix';
import { storesLoadedSelector } from './selectors';
import { useSubscription } from 'app/utils/hooks';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import DragGhostItem from './DragGhostItem';
import { t } from 'app/i18next-t';

interface ProvidedProps {
  account: DestinyAccount;
}

interface StoreProps {
  storesLoaded: boolean;
}

type Props = ProvidedProps & StoreProps;

function mapStateToProps(state: RootState): StoreProps {
  return {
    storesLoaded: storesLoadedSelector(state),
  };
}

function getStoresService(account: DestinyAccount) {
  return account.destinyVersion === 1 ? D1StoresService : D2StoresService;
}

function Inventory({ storesLoaded, account }: Props) {
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
      <DragGhostItem />
      <InfusionFinder destinyVersion={account.destinyVersion} />
      <ClearNewItems account={account} />
    </ErrorBoundary>
  );
}

export default connect<StoreProps>(mapStateToProps)(Inventory);
