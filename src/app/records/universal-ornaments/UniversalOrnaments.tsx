import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import { createItemContextSelector } from 'app/inventory/selectors';
import { ItemCreationContext, makeFakeItem } from 'app/inventory/store/d2-item-factory';
import { useD2Definitions } from 'app/manifest/selectors';
import { objectValues } from 'app/utils/util-types';
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
export default function UniversalOrnamentsContents() {
  const defs = useD2Definitions();
  const createItemContext = useSelector(createItemContextSelector);
  const unlocked = useSelector(univeralOrnamentsVisibilitySelector);
  if (!defs) {
    return null;
  }
  const data = buildSets(defs);

  return (
    <div className={styles.classType}>
      {objectValues(data).flatMap((sets) => (
        <CollapsibleTitle
          title={sets.name}
          sectionId={`class-${sets.classType}`}
          defaultCollapsed={true}
        >
          <div className={styles.records}>
            {Object.values(sets.sets).map((set) => (
              <Ornaments
                key={`${sets.classType}-${set.key}`}
                set={set}
                ownedItemHashes={unlocked}
                context={createItemContext}
              />
            ))}
          </div>
        </CollapsibleTitle>
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
  ownedItemHashes: OrnamentStatus;
}) {
  if (set.ornamentHashes.every((hash) => !ownedItemHashes.visibleOrnaments.has(hash))) {
    return null;
  }
  const complete = set.ornamentHashes.every((hash) => ownedItemHashes.unlockedOrnaments.has(hash));

  return (
    <div
      className={clsx(styles.record, {
        [styles.redeemed]: complete,
      })}
    >
      <h3>{set.name}</h3>
      <div className={styles.ornaments}>
        {set.ornamentHashes.map((hash) => {
          const acquired = ownedItemHashes.visibleOrnaments.has(hash);
          const owned = ownedItemHashes.unlockedOrnaments.has(hash);
          const item = makeFakeItem(context, hash);
          if (!item) {
            return null;
          }
          return (
            <VendorItemDisplay
              key={hash}
              item={item}
              unavailable={!owned}
              acquired={acquired}
              owned={owned}
              extraData={{ acquired, owned }}
            />
          );
        })}
      </div>
    </div>
  );
}
