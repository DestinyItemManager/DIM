import { DestinyAccount } from 'app/accounts/destiny-account';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import GearPower from 'app/gear-power/GearPower';
import { t } from 'app/i18next-t';
import DragPerformanceFix from 'app/inventory/DragPerformanceFix';
import { useLoadStores } from 'app/inventory/store/hooks';
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
    <>
      <Stores />
      <DragPerformanceFix />
      {account.destinyVersion === 2 && <GearPower />}
      {account.destinyVersion === 2 && <MaterialCountsSheet />}
    </>
  );
}
