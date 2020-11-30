import { DestinyAccount } from 'app/accounts/destiny-account';
import CurrentActivity from 'app/active-mode/Views/CurrentActivity';
import FarmingTools from 'app/active-mode/Views/FarmingTools';
import PostmasterView from 'app/active-mode/Views/PostmasterView';
import PursuitsView from 'app/active-mode/Views/PursuitsView';
import RecentItems from 'app/active-mode/Views/RecentItems';
import { InventoryBuckets } from 'app/inventory/inventory-buckets';
import { DimStore } from 'app/inventory/store-types';
import { getVault } from 'app/inventory/stores-helpers';
import { loadAllVendors } from 'app/vendors/actions';
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import styles from './ActiveMode.m.scss';

interface Props {
  account: DestinyAccount;
  buckets: InventoryBuckets;
  currentStore: DimStore;
  stores: DimStore[];
  singleCharacter: boolean;
}

const CharacterTile = ({ store }: { store: DimStore }) => (
  <>
    <div className={styles.emblem} style={{ backgroundImage: `url("${store.icon}")` }} />
    <div>{store.className}</div>
  </>
);

/**
 * Display current activity, selected character, and entire inventory
 */
export default function ActiveMode({
  account,
  stores,
  currentStore,
  buckets,
  singleCharacter,
}: Props) {
  const vault = stores && getVault(stores)!;
  const dispatch = useDispatch();

  useEffect(() => {
    ga('send', 'pageview', `/profileMembershipId/d${account.destinyVersion}/active`);
  }, [account]);

  useEffect(() => {
    dispatch(loadAllVendors(account, currentStore.id));
  }, [account, currentStore, dispatch]);

  return (
    <div className={styles.content}>
      <div className={styles.header}>
        {!singleCharacter && <CharacterTile store={currentStore} />}
      </div>
      <FarmingTools store={currentStore} />
      {singleCharacter && <PostmasterView store={currentStore} vault={vault} buckets={buckets} />}
      <CurrentActivity account={account} store={currentStore} buckets={buckets} />
      <PursuitsView store={currentStore} />
      <RecentItems />
    </div>
  );
}
