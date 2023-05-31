import ShowPageLoading from 'app/dim-ui/ShowPageLoading';
import { default as useScrollPaginate } from 'app/dim-ui/useScrollPaginate';
import { t } from 'app/i18next-t';
import { useSetting } from 'app/settings/hooks';
import { AppIcon, collapseIcon, faCaretUp } from 'app/shell/icons';
import clsx from 'clsx';
import React, { Suspense, useEffect } from 'react';
import styles from './ItemFeedSidebar.m.scss';

const ItemFeed = React.lazy(() => import(/* webpackChunkName: "item-feed" */ './ItemFeed'));

/**
 * The Item Feed in an expandable sidebar to be placed on the inventory screen.
 */
export default function ItemFeedSidebar() {
  const [expanded, setExpanded] = useSetting('itemFeedExpanded');

  const [numItemsToShow, resetPage, marker] = useScrollPaginate(10);

  const handleToggle = () => {
    setExpanded(!expanded);
    if (!expanded) {
      resetPage();
    }
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
            <ItemFeed itemsToShow={numItemsToShow} resetItemCount={resetPage} />
          </Suspense>
          {marker}
        </div>
      )}
    </div>
  );
}
