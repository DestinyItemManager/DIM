import { DestinyAccount } from 'app/accounts/destiny-account';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { useLoadStores } from 'app/inventory/store/hooks';
import { usePageTitle } from 'app/utils/hooks';
import { Suspense, lazy } from 'react';
import * as styles from './ItemFeedPage.m.scss';

const ItemFeed = lazy(() => import(/* webpackChunkName: "item-feed" */ './ItemFeed'));

/**
 * The Item Feed in a full page for mobile.
 */
export default function ItemFeedPage({ account }: { account: DestinyAccount }) {
  usePageTitle(t('ItemFeed.Description'));
  const storesLoaded = useLoadStores(account);
  if (!storesLoaded) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  return (
    <div className={styles.page}>
      <Suspense fallback={<ShowPageLoading message={t('Loading.Code')} />}>
        <ItemFeed page />
      </Suspense>
    </div>
  );
}
