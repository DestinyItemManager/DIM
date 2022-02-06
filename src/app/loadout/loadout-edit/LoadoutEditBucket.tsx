import ClosableContainer from 'app/dim-ui/ClosableContainer';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import { InventoryBucket } from 'app/inventory/inventory-buckets';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { bucketsSelector } from 'app/inventory/selectors';
import { LockableBucketHashes } from 'app/loadout-builder/types';
import { DimLoadoutItem, Loadout } from 'app/loadout-drawer/loadout-types';
import { getLoadoutStats } from 'app/loadout-drawer/loadout-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { useIsPhonePortrait } from 'app/shell/selectors';
import { LoadoutStats } from 'app/store-stats/CharacterStats';
import { emptyArray } from 'app/utils/empty';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import { BucketPlaceholder } from '../loadout-ui/BucketPlaceholder';
import { FashionMods } from '../loadout-ui/FashionMods';
import LoadoutParametersDisplay from '../loadout-ui/LoadoutParametersDisplay';
import { OptimizerButton } from '../loadout-ui/OptimizerButton';
import styles from './LoadoutEditBucket.m.scss';

const categoryStyles = {
  Weapons: styles.categoryWeapons,
  Armor: styles.categoryArmor,
  General: styles.categoryGeneral,
};

export default function LoadoutEditBucket({
  category,
  subclass,
  storeId,
  items,
  savedMods,
  modsByBucket,
  equippedItemIds,
  loadout,
  onClickPlaceholder,
  onClickWarnItem,
  onRemoveItem,
}: {
  category: string;
  subclass?: DimLoadoutItem;
  storeId?: string;
  items?: DimItem[];
  savedMods: PluggableInventoryItemDefinition[];
  modsByBucket: {
    [bucketHash: number]: number[];
  };
  equippedItemIds: Set<string>;
  loadout: Loadout;
  onClickPlaceholder: (params: { bucket: InventoryBucket }) => void;
  onClickWarnItem: (item: DimItem) => void;
  onRemoveItem: (item: DimItem) => void;
}) {
  const defs = useD2Definitions()!;
  const buckets = useSelector(bucketsSelector)!;
  const itemsByBucket = _.groupBy(items, (i) => i.bucket.hash);
  const isPhonePortrait = useIsPhonePortrait();
  const bucketOrder =
    category === 'Weapons' || category === 'Armor'
      ? buckets.byCategory[category]
      : [BucketHashes.Ghost, BucketHashes.Emblems, BucketHashes.Ships, BucketHashes.Vehicle].map(
          (h) => buckets.byHash[h]
        );
  const equippedItems =
    items?.filter((i) => equippedItemIds.has(i.id) && i.owner !== 'unknown') ?? [];

  const isArmor = category === 'Armor';
  const hasFashion = isArmor && !_.isEmpty(modsByBucket);

  if (isPhonePortrait && !items && !hasFashion) {
    return null;
  }

  return (
    <div key={category} className={clsx(styles.itemCategory, categoryStyles[category])}>
      <div className={styles.itemsInCategory}>
        {bucketOrder.map((bucket) => (
          <ItemBucket
            key={bucket.hash}
            bucket={bucket}
            items={itemsByBucket[bucket.hash]}
            equippedItemIds={equippedItemIds}
            onClickPlaceholder={onClickPlaceholder}
            onClickWarnItem={onClickWarnItem}
            onRemoveItem={onRemoveItem}
            equippedContent={
              isArmor && (
                <FashionMods
                  modsForBucket={modsByBucket[bucket.hash] ?? emptyArray()}
                  storeId={storeId}
                />
              )
            }
          />
        ))}
      </div>
      {isArmor && (
        <>
          {equippedItems.length === 5 && (
            <div className="stat-bars destiny2">
              <LoadoutStats
                stats={getLoadoutStats(defs, loadout.classType, subclass, equippedItems, savedMods)}
                characterClass={loadout.classType}
              />
            </div>
          )}
          {loadout.parameters && <LoadoutParametersDisplay params={loadout.parameters} />}
          <OptimizerButton loadout={loadout} />
        </>
      )}
    </div>
  );
}

function ItemBucket({
  bucket,
  items,
  equippedItemIds,
  equippedContent,
  onClickPlaceholder,
  onClickWarnItem,
  onRemoveItem,
}: {
  bucket: InventoryBucket;
  items: DimItem[];
  equippedItemIds: Set<string>;
  equippedContent?: React.ReactNode;
  onClickPlaceholder: (params: { bucket: InventoryBucket }) => void;
  onClickWarnItem: (item: DimItem) => void;
  onRemoveItem: (item: DimItem) => void;
}) {
  const bucketHash = bucket.hash;
  const [equipped, unequipped] = _.partition(items, (i) =>
    i.owner === 'unknown' ? i.equipped : equippedItemIds.has(i.id)
  );

  const showFashion = LockableBucketHashes.includes(bucketHash);

  const handlePlaceholderClick = () => onClickPlaceholder({ bucket });

  // TODO: plumb through API from context??
  // TODO: expose a menu item for adding more items?
  // TODO: add-unequipped button?
  // T0DO: customize buttons in item popup?
  // TODO: draggable items?

  return (
    <div className={clsx(styles.itemBucket, { [styles.showFashion]: showFashion })}>
      {[equipped, unequipped].map((items, index) =>
        items.length > 0 ? (
          <div
            className={clsx(styles.items, index === 0 ? styles.equipped : styles.unequipped)}
            key={index}
          >
            {items.map((item) => (
              <ClosableContainer
                key={item.id}
                onClose={() => onRemoveItem(item)}
                showCloseIconOnHover
              >
                <ItemPopupTrigger item={item}>
                  {(ref, onClick) => (
                    <div
                      className={clsx({
                        [styles.missingItem]: item.owner === 'unknown',
                      })}
                    >
                      <ConnectedInventoryItem
                        item={item}
                        innerRef={ref}
                        onClick={item.owner === 'unknown' ? () => onClickWarnItem(item) : onClick}
                      />
                    </div>
                  )}
                </ItemPopupTrigger>
              </ClosableContainer>
            ))}
            {index === 0 && equippedContent}
          </div>
        ) : (
          index === 0 && (
            <div
              className={clsx(styles.items, index === 0 ? styles.equipped : styles.unequipped)}
              key={index}
            >
              <BucketPlaceholder bucketHash={bucketHash} onClick={handlePlaceholderClick} />
              {equippedContent}
            </div>
          )
        )
      )}
    </div>
  );
}
