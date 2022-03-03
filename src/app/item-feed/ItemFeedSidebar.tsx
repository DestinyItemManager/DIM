import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { t } from 'app/i18next-t';
import { useSetting } from 'app/settings/hooks';
import { AppIcon, collapseIcon, faCaretUp } from 'app/shell/icons';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import React, { Suspense, useEffect, useState } from 'react';
import styles from './ItemFeedSidebar.m.scss';

const ItemFeed = React.lazy(() => import(/* webpackChunkName: "item-feed" */ './ItemFeed'));

/**
 * The Item Feed in an expandable sidebar to be placed on the inventory screen.
 */
export default function ItemFeedSidebar() {
  const [expanded, setExpanded] = useSetting('itemFeedExpanded');
  const [itemsToShow, setItemsToShow] = useState(10);

  const handleToggle = () => {
    setExpanded(!expanded);
    if (!expanded) {
      setItemsToShow(10);
    }
  };

  const handlePaginate = () => {
    setItemsToShow((itemsToShow) => itemsToShow + 10);
  };

  useEffect(() => {
    document.querySelector('html')!.style.setProperty('--expanded-sidebars', `${expanded ? 1 : 0}`);
  }, [expanded]);

  return (
    <div className={clsx(styles.trayContainer, { [styles.expanded]: expanded })}>
      <button className={styles.trayButton} type="button" onClick={handleToggle}>
        {t('ItemFeed.Description')} <AppIcon icon={expanded ? collapseIcon : faCaretUp} />
      </button>
      {expanded && (
        <div className={styles.sideTray}>
          <Suspense fallback={<ShowPageLoading message={t('Loading.Code')} />}>
            <ItemFeed itemsToShow={itemsToShow} />
          </Suspense>
          <motion.div onViewportEnter={handlePaginate} />
        </div>
      )}
    </div>
  );
}
