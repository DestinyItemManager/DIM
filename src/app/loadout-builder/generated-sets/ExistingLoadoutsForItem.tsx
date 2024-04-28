import { PressTip } from 'app/dim-ui/PressTip';
import { DimItem } from 'app/inventory/item-types';
import { loadoutsByItemSelector } from 'app/loadout-drawer/selectors';
import InGameLoadoutIcon from 'app/loadout/ingame/InGameLoadoutIcon';
import { partition } from 'lodash';
import { useSelector } from 'react-redux';

import { InGameLoadout } from 'app/loadout-drawer/loadout-types';
import styles from './ExistingLoadoutsForItem.m.scss';

export default function ExistingLoadoutsForItem({ item }: { item: DimItem }) {
  const loadoutsByItem = useSelector(loadoutsByItemSelector);
  const loadoutsForItem = loadoutsByItem[item.id];
  const loadoutCount = loadoutsForItem?.length || 0;
  const [inGameLoadouts, dimLoadouts] = partition(
    loadoutsForItem,
    ({ loadout }) => 'index' in loadout,
  );

  if (!loadoutsForItem || loadoutCount === 0) {
    return <div className={styles.loadoutsBar} />;
  }

  return (
    <PressTip tooltip={null} className={styles.loadoutsBar}>
      <ul className={styles.inGameLoadoutList}>
        {inGameLoadouts.map(({ loadout }) => (
          <li key={loadout.id}>
            <InGameLoadoutIcon loadout={loadout as InGameLoadout} size={10} />
          </li>
        ))}
      </ul>
      {Boolean(inGameLoadouts.length) && Boolean(dimLoadouts.length) && '+'}
      <span className={styles.loadoutCount}>{loadoutCount}</span>
    </PressTip>
  );
}
