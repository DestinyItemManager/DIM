import { t } from 'app/i18next-t';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { bucketsSelector } from 'app/inventory/selectors';
import ItemPopupTrigger from 'app/item-popup/ItemPopupTrigger';
import ConnectedInventoryItem from 'app/item/ConnectedInventoryItem';
import DraggableInventoryItem from 'app/item/DraggableInventoryItem';
import { LockableBucketHashes } from 'app/loadout-builder/types';
import { Loadout, ResolvedLoadoutItem } from 'app/loadout/loadout-types';
import { getLoadoutStats } from 'app/loadout/loadout-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { LoadoutStats } from 'app/store-stats/CharacterStats';
import { emptyArray } from 'app/utils/empty';
import clsx from 'clsx';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import { BucketPlaceholder } from './BucketPlaceholder';
import { FashionMods } from './FashionMods';
import styles from './LoadoutItemCategorySection.m.scss';
import LoadoutParametersDisplay from './LoadoutParametersDisplay';
import { OptimizerButton } from './OptimizerButton';

const categoryStyles = {
  Weapons: styles.categoryWeapons,
  Armor: styles.categoryArmor,
  General: styles.categoryGeneral,
};

export default function LoadoutItemCategorySection({
  category,
  subclass,
  storeId,
  items,
  savedMods,
  modsByBucket,
  loadout,
  hideOptimizeArmor,
}: {
  category: string;
  subclass?: ResolvedLoadoutItem;
  storeId?: string;
  items?: ResolvedLoadoutItem[];
  savedMods: PluggableInventoryItemDefinition[];
  modsByBucket: {
    [bucketHash: number]: number[];
  };
  loadout: Loadout;
  hideOptimizeArmor?: boolean;
}) {
  const defs = useD2Definitions()!;
  const buckets = useSelector(bucketsSelector)!;
  const itemsByBucket = _.groupBy(items, (li) => li.item.bucket.hash);
  const isPhonePortrait = useIsPhonePortrait();
  const bucketOrder =
    category === 'Weapons' || category === 'Armor'
      ? buckets.byCategory[category]
      : _.sortBy(
          Object.keys(itemsByBucket).map((bucketHash) => buckets.byHash[parseInt(bucketHash, 10)]),
          (bucket) => buckets.byCategory[category].findIndex((b) => b.hash === bucket.hash)
        );
  const equippedItems =
    items?.filter((li) => li.loadoutItem.equip && !li.missing).map((li) => li.item) ?? [];

  const isArmor = category === 'Armor';
  const hasFashion = isArmor && !_.isEmpty(modsByBucket);

  if (isPhonePortrait && !items && !hasFashion) {
    return null;
  }

  return (
    <div key={category} className={clsx(styles.itemCategory, categoryStyles[category])}>
      {items || hasFashion ? (
        <div className={styles.itemsInCategory}>
          {bucketOrder.map((bucket) => (
            <ItemBucket
              key={bucket.hash}
              storeId={storeId}
              bucketHash={bucket.hash}
              items={itemsByBucket[bucket.hash]}
              modsForBucket={modsByBucket[bucket.hash] ?? emptyArray()}
            />
          ))}
        </div>
      ) : (
        <>
          <div className={clsx(styles.placeholder, `category-${category}`)}>
            {t(`Bucket.${category}`, { contextList: 'buckets' })}
          </div>
        </>
      )}
      {items && isArmor && (
        <>
          {equippedItems.length === 5 && (
            <div className="stat-bars destiny2">
              <LoadoutStats
                showTier
                stats={getLoadoutStats(defs, loadout.classType, subclass, equippedItems, savedMods)}
                characterClass={loadout.classType}
              />
            </div>
          )}
          {loadout.parameters && <LoadoutParametersDisplay params={loadout.parameters} />}
          {!hideOptimizeArmor && <OptimizerButton loadout={loadout} />}
        </>
      )}
    </div>
  );
}

function ItemBucket({
  bucketHash,
  storeId,
  items,
  modsForBucket,
}: {
  bucketHash: number;
  storeId?: string;
  items: ResolvedLoadoutItem[];
  modsForBucket: number[];
}) {
  const [equipped, unequipped] = _.partition(items, (li) => li.loadoutItem.equip);

  const showFashion = LockableBucketHashes.includes(bucketHash);

  // TODO: should these be draggable? so you can drag them into other loadouts?

  return (
    <div className={clsx(styles.itemBucket, { [styles.showFashion]: showFashion })}>
      {[equipped, unequipped].map((items, index) =>
        items.length > 0 ? (
          <div
            className={clsx(styles.items, index === 0 ? styles.equipped : styles.unequipped)}
            key={index}
          >
            {items.map(({ item, loadoutItem }) => (
              <DraggableInventoryItem item={item} key={item.id}>
                <ItemPopupTrigger
                  item={item}
                  extraData={{ socketOverrides: loadoutItem.socketOverrides }}
                >
                  {(ref, onClick) => (
                    <div
                      className={clsx({
                        [styles.missingItem]: item.owner === 'unknown',
                      })}
                    >
                      <ConnectedInventoryItem item={item} innerRef={ref} onClick={onClick} />
                    </div>
                  )}
                </ItemPopupTrigger>
              </DraggableInventoryItem>
            ))}
            {index === 0 && showFashion && (
              <FashionMods modsForBucket={modsForBucket} storeId={storeId} />
            )}
          </div>
        ) : (
          index === 0 && (
            <div
              className={clsx(styles.items, index === 0 ? styles.equipped : styles.unequipped)}
              key={index}
            >
              <BucketPlaceholder bucketHash={bucketHash} />
              {/* TODO: show empty placeholder for bucket type? */}
              {showFashion && <FashionMods modsForBucket={modsForBucket} storeId={storeId} />}
            </div>
          )
        )
      )}
    </div>
  );
}
