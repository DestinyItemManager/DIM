import { DestinyAccount } from 'app/accounts/destiny-account';
import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { useLoadStores } from 'app/inventory/store/hooks';
import { motion } from 'framer-motion';
import React, { Suspense, useState } from 'react';
import styles from './ItemFeedPage.m.scss';

const ItemFeed = React.lazy(() => import(/* webpackChunkName: "item-feed" */ './ItemFeed'));

/**
 * The Item Feed in a full page for mobile.
 */
export default function ItemFeedPage({ account }: { account: DestinyAccount }) {
  const [itemsToShow, setItemsToShow] = useState(10);

  const handlePaginate = () => {
    setItemsToShow((itemsToShow) => itemsToShow + 10);
  };

  const storesLoaded = useLoadStores(account);
  if (!storesLoaded) {
    return <ShowPageLoading message={t('Loading.Profile')} />;
  }

  return (
    <div className={styles.page}>
      <Suspense fallback={<ShowPageLoading message={t('Loading.Code')} />}>
        <ItemFeed itemsToShow={itemsToShow} />
      </Suspense>
      <motion.div onViewportEnter={handlePaginate} />
    </div>
  );
}
