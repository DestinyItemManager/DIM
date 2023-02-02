import { createItemContextSelector } from 'app/inventory/selectors';
import { ItemCreationContext, makeFakeItem } from 'app/inventory/store/d2-item-factory';
import { useD2Definitions } from 'app/manifest/selectors';
import { VendorItemDisplay } from 'app/vendors/VendorItemComponent';
import clsx from 'clsx';
import { useSelector } from 'react-redux';
import styles from './UniversalOrnaments.m.scss';
import {
  OrnamentStatus,
  OrnamentsSet,
  buildSets,
  univeralOrnamentsVisibilitySelector,
} from './universal-ornaments';

/**
 * Displays "leaf node" contents for presentation nodes (collectibles, triumphs, metrics)
 */
export default function UniversalOrnaments() {
  const defs = useD2Definitions();
  const createItemContext = useSelector(createItemContextSelector);
  const unlocked = useSelector(univeralOrnamentsVisibilitySelector);
  if (!defs) {
    return null;
  }
  const data = buildSets(defs);

  return (
    <div className={styles.records}>
      {data.sets.map((set) => (
        <Ornaments key={set.key} set={set} ownedItemHashes={unlocked} context={createItemContext} />
      ))}
    </div>
  );
}

function Ornaments({
  set,
  context,
  ownedItemHashes,
}: {
  set: OrnamentsSet;
  context: ItemCreationContext;
  ownedItemHashes?: OrnamentStatus;
}) {
  if (set.ornamentHashes.every((hash) => !ownedItemHashes?.visibleOrnaments.has(hash))) {
    return null;
  }
  const complete = set.ornamentHashes.every((hash) => ownedItemHashes?.unlockedOrnaments.has(hash));

  return (
    <div
      className={clsx(styles.record, {
        [styles.redeemed]: complete,
      })}
    >
      <h3>{set.name}</h3>
      <div className={styles.ornaments}>
        {set.ornamentHashes.map((hash) => {
          const item = makeFakeItem(context, hash);
          if (!item) {
            return null;
          }
          return (
            <VendorItemDisplay
              key={hash}
              item={item}
              unavailable={!ownedItemHashes?.unlockedOrnaments.has(hash)}
              owned={false}
            />
          );
        })}
      </div>
    </div>
  );

  /* return (
    <>
      {set.name}
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {set.ornamentHashes.map((hash) => {
          const item = makeFakeItem(context, hash);
          if (!item) {
            return null;
          }
          return (
            <VendorItemDisplay
              key={hash}
              item={item}
              unavailable={!ownedItemHashes?.has(hash)}
              owned={false}
            />
          );
        })}
      </div>
    </>
  ); */
}
