import { DimItem } from 'app/inventory/item-types';
import { loadoutsByItemSelector } from 'app/loadout-drawer/selectors';
import helmet from 'destiny-icons/armor_types/helmet.svg';
import { useSelector } from 'react-redux';

import styles from './ExistingLoadoutsForItem.m.scss';

export default function ExistingLoadoutsForItem({ item }: { item: DimItem }) {
  const loadoutsByItem = useSelector(loadoutsByItemSelector);
  const loadoutsForItem = loadoutsByItem[item.id];
  const loadoutCount = loadoutsForItem?.length || 0;

  if (!loadoutsForItem || loadoutCount === 0) {
    return <div className={styles.loadoutsBar} />;
  }

  return (
    <div className={styles.loadoutsBar}>
      <img src={helmet} className={styles.inLoadout} />
      {loadoutCount}
    </div>
  );
}
