import CollapsibleTitle from 'app/dim-ui/CollapsibleTitle';
import { DimItem } from 'app/inventory/item-types';
import { createItemContextSelector } from 'app/inventory/selectors';
import { useD2Definitions } from 'app/manifest/selectors';
import { ItemFilter } from 'app/search/filter-types';
import { objectValues } from 'app/utils/util-types';
import { VendorItemDisplay } from 'app/vendors/VendorItemComponent';
import clsx from 'clsx';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import styles from './UniversalOrnaments.m.scss';
import {
  OrnamentStatus,
  OrnamentsSet,
  buildSets,
  filterOrnamentSets,
  univeralOrnamentsVisibilitySelector,
} from './universal-ornaments';

/**
 * Displays "leaf node" contents for presentation nodes (collectibles, triumphs, metrics)
 */
export default function UniversalOrnamentsContents({
  searchQuery,
  searchFilter,
}: {
  searchQuery: string;
  searchFilter: ItemFilter;
}) {
  const defs = useD2Definitions();
  const createItemContext = useSelector(createItemContextSelector);
  const unlocked = useSelector(univeralOrnamentsVisibilitySelector);

  const defData = defs && buildSets(defs);
  const populatedData = useMemo(
    () => defData && filterOrnamentSets(defData, createItemContext, searchQuery, searchFilter),
    [createItemContext, defData, searchFilter, searchQuery]
  );

  if (!populatedData) {
    return null;
  }

  return (
    <div className={styles.classType}>
      {objectValues(populatedData).flatMap((sets) => (
        <CollapsibleTitle
          key={sets.classType}
          title={sets.name}
          sectionId={`class-${sets.classType}`}
          defaultCollapsed={true}
        >
          <div className={styles.records}>
            {Object.values(sets.sets).map((set) => (
              <Ornaments key={set.key} set={set} ownedItemHashes={unlocked} />
            ))}
          </div>
        </CollapsibleTitle>
      ))}
    </div>
  );
}

function Ornaments({
  set,
  ownedItemHashes,
}: {
  set: OrnamentsSet<DimItem>;
  ownedItemHashes: OrnamentStatus;
}) {
  // If none of the ornaments for this set are visible in an in-game socket, we should
  // hide this, since it's likely some Eververse set
  if (set.ornaments.every((item) => !ownedItemHashes.visibleOrnaments.has(item.hash))) {
    return null;
  }
  const complete = set.ornaments.every((item) => ownedItemHashes.unlockedOrnaments.has(item.hash));

  return (
    <div
      className={clsx(styles.record, {
        [styles.redeemed]: complete,
      })}
    >
      <h3>{set.name}</h3>
      <div className={styles.ornaments}>
        {set.ornaments.map((item) => {
          const acquired = ownedItemHashes.visibleOrnaments.has(item.hash);
          const owned = ownedItemHashes.unlockedOrnaments.has(item.hash);
          return (
            <VendorItemDisplay
              key={item.hash}
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
