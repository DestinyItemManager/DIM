import { DestinyAccount } from 'app/accounts/destiny-account';
import ErrorBoundary from 'app/dim-ui/ErrorBoundary';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import GearPower from 'app/gear-power/GearPower';
import { t } from 'app/i18next-t';
import DragPerformanceFix from 'app/inventory/DragPerformanceFix';
import { useLoadStores } from 'app/inventory/store/hooks';
import IssueAwarenessBanner from 'app/issue-awareness-banner/IssueAwarenessBanner';
import { MaterialCountsSheet } from 'app/material-counts/MaterialCountsWrappers';
import { usePageTitle } from 'app/utils/hooks';
import Stores from './Stores';

export default function Inventory({ account }: { account: DestinyAccount }) {
  const storesLoaded = useLoadStores(account);
  usePageTitle(t('Header.Inventory'));

  if (!storesLoaded) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  return (
    <ErrorBoundary name="Inventory">
      <Stores />
      <DragPerformanceFix />
      {account.destinyVersion === 2 && <GearPower />}
      {account.destinyVersion === 2 && <MaterialCountsSheet />}
      {$featureFlags.issueBanner && <IssueAwarenessBanner />}
    </ErrorBoundary>
  );
}
