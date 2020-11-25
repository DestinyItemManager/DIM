import { DestinyAccount } from 'app/accounts/destiny-account';
import CurrentActivity from 'app/active-mode/Views/CurrentActivity';
import PostmasterView from 'app/active-mode/Views/PostmasterView';
import PursuitsView from 'app/active-mode/Views/PursuitsView';
import RecentItems from 'app/active-mode/Views/RecentItems';
import { t } from 'app/i18next-t';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { DimStore } from 'app/inventory/store-types';
import { getVault } from 'app/inventory/stores-helpers';
import { setSetting } from 'app/settings/actions';
import { AppIcon, closeIcon, maximizeIcon, minimizeIcon } from 'app/shell/icons';
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import styles from './ActiveMode.m.scss';

interface Props {
  account: DestinyAccount;
  buckets: InventoryBuckets;
  currentStore: DimStore;
  stores: DimStore[];
  isOpen: boolean;
}

/**
 * Display current activity, selected character, and entire inventory
 */
export default function ActiveMode({ account, stores, currentStore, buckets, isOpen }: Props) {
  const dispatch = useDispatch();
  const vault = stores && getVault(stores)!;

  useEffect(() => {
    ga('send', 'pageview', `/profileMembershipId/d${account.destinyVersion}/active`);
  }, [account]);

  if (isOpen) {
    return (
      <div
        className={styles.closedBar}
        onClick={() => {
          dispatch(setSetting('activeMode', !isOpen));
        }}
      >
        <h2 className={styles.closedBarText}>
          {t(`ActiveMode.ButtonOn`)}
          <AppIcon className="fa-rotate-90" icon={isOpen ? minimizeIcon : maximizeIcon} />
        </h2>
      </div>
    );
  }

  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <div
          className={styles.closeButton}
          onClick={() => {
            dispatch(setSetting('activeMode', !isOpen));
          }}
        >
          <AppIcon icon={closeIcon} />
        </div>
      </div>
      <CurrentActivity account={account} store={currentStore} buckets={buckets} />
      <PostmasterView store={currentStore} vault={vault} buckets={buckets} />
      <PursuitsView store={currentStore} />
      <RecentItems store={currentStore} />
    </div>
  );
}
