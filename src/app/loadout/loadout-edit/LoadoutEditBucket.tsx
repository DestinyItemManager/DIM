import { LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import ClosableContainer from 'app/dim-ui/ClosableContainer';
import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import DraggableInventoryItem from 'app/inventory/DraggableInventoryItem';
import { D2BucketCategory, InventoryBucket } from 'app/inventory/inventory-buckets';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { bucketsSelector } from 'app/inventory/selectors';
import { LockableBucketHashes } from 'app/loadout-builder/types';
import { Loadout, ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import { getLoadoutStats, singularBucketHashes } from 'app/loadout-drawer/loadout-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { addIcon, AppIcon, faTshirt } from 'app/shell/icons';
import { LoadoutStats } from 'app/store-stats/CharacterStats';
import { emptyArray } from 'app/utils/empty';
import { Portal } from 'app/utils/temp-container';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import FashionDrawer from '../fashion/FashionDrawer';
import { BucketPlaceholder } from '../loadout-ui/BucketPlaceholder';
import { FashionMods } from '../loadout-ui/FashionMods';
import LoadoutParametersDisplay from '../loadout-ui/LoadoutParametersDisplay';
import { OptimizerButton } from '../loadout-ui/OptimizerButton';
import styles from './LoadoutEditBucket.m.scss';
import LoadoutEditItemDropTarget from './LoadoutEditItemDropTarget';

const categoryStyles = {
  Weapons: styles.categoryWeapons,
  Armor: styles.categoryArmor,
  General: styles.categoryGeneral,
};

export default function LoadoutEditBucket({
  category,
  classType,
  storeId,
  items,
  modsByBucket,
  onClickPlaceholder,
  onClickWarnItem,
  onRemoveItem,
  onToggleEquipped,
  children,
}: {
  category: D2BucketCategory;
  classType: DestinyClass;
  storeId: string;
  items?: ResolvedLoadoutItem[];
  modsByBucket: {
    [bucketHash: number]: number[] | undefined;
  };
  onClickPlaceholder: (params: { bucket: InventoryBucket; equip: boolean }) => void;
  onClickWarnItem: (resolvedItem: ResolvedLoadoutItem) => void;
  onToggleEquipped: (resolvedItem: ResolvedLoadoutItem) => void;
  onRemoveItem: (resolvedItem: ResolvedLoadoutItem) => void;
  children?: React.ReactNode;
}) {
  const buckets = useSelector(bucketsSelector)!;
  const itemsByBucket = _.groupBy(items, (li) => li.item.bucket.hash);
  const bucketOrder =
    category === 'Weapons' || category === 'Armor'
      ? buckets.byCategory[category]
      : [BucketHashes.Ghost, BucketHashes.Emblems, BucketHashes.Ships, BucketHashes.Vehicle].map(
          (h) => buckets.byHash[h]
        );
  const isArmor = category === 'Armor';

  return (
    <div className={clsx(styles.itemCategory, categoryStyles[category])}>
      <div className={styles.itemsInCategory}>
        {bucketOrder.map((bucket) => (
          <ItemBucket
            key={bucket.hash}
            classType={classType}
            bucket={bucket}
            items={itemsByBucket[bucket.hash]}
            onClickPlaceholder={onClickPlaceholder}
            onClickWarnItem={onClickWarnItem}
            onRemoveItem={onRemoveItem}
            onToggleEquipped={onToggleEquipped}
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
      {children}
    </div>
  );
}

export function ArmorExtras({
  loadout,
  storeId,
  subclass,
  allMods,
  items,
  onModsByBucketUpdated,
}: {
  loadout: Loadout;
  storeId: string;
  subclass?: ResolvedLoadoutItem;
  allMods: PluggableInventoryItemDefinition[];
  items?: ResolvedLoadoutItem[];
  onModsByBucketUpdated(modsByBucket: LoadoutParameters['modsByBucket']): void;
}) {
  const defs = useD2Definitions()!;
  const equippedItems =
    items?.filter((li) => li.loadoutItem.equip && !li.missing).map((li) => li.item) ?? [];

  return (
    <>
      {equippedItems.length === 5 && (
        <div className="stat-bars destiny2">
          <LoadoutStats
            showTier
            stats={getLoadoutStats(defs, loadout.classType, subclass, equippedItems, allMods)}
          />
        </div>
      )}
      {loadout.parameters && <LoadoutParametersDisplay params={loadout.parameters} />}
      <div className={styles.buttons}>
        <FashionButton
          loadout={loadout}
          items={items ?? emptyArray()}
          storeId={storeId}
          onModsByBucketUpdated={onModsByBucketUpdated}
        />
        <OptimizerButton loadout={loadout} />
      </div>
    </>
  );
}

/**
 * An extension of the usual draggable inventory item for loadouts that allows the for
 * removal of the item from the loadout. This also handles styling for when an item is
 * missing.
 */
const DraggableRemovableLoadoutItem = React.memo(
  ({
    loadoutItem,
    onClickWarnItem,
    onRemoveItem,
    onToggleEquipped,
  }: {
    loadoutItem: ResolvedLoadoutItem;
    onClickWarnItem: (resolvedItem: ResolvedLoadoutItem) => void;
    onRemoveItem: (resolvedItem: ResolvedLoadoutItem) => void;
    onToggleEquipped: (resolvedItem: ResolvedLoadoutItem) => void;
  }) => (
    <DraggableInventoryItem item={loadoutItem.item}>
      <ClosableContainer onClose={() => onRemoveItem(loadoutItem)} showCloseIconOnHover>
        <ItemPopupTrigger
          item={loadoutItem.item}
          extraData={{ socketOverrides: loadoutItem.loadoutItem.socketOverrides }}
        >
          {(ref, onClick) => (
            <div
              className={clsx({
                [styles.missingItem]: loadoutItem.missing,
              })}
            >
              <ConnectedInventoryItem
                item={loadoutItem.item}
                innerRef={ref}
                onClick={loadoutItem.missing ? () => onClickWarnItem(loadoutItem) : onClick}
                onDoubleClick={() => onToggleEquipped(loadoutItem)}
              />
            </div>
          )}
        </ItemPopupTrigger>
      </ClosableContainer>
    </DraggableInventoryItem>
  )
);

function ItemBucket({
  classType,
  bucket,
  items,
  equippedContent,
  onClickPlaceholder,
  onClickWarnItem,
  onRemoveItem,
  onToggleEquipped,
}: {
  classType: DestinyClass;
  bucket: InventoryBucket;
  items: ResolvedLoadoutItem[];
  equippedContent?: React.ReactNode;
  onClickPlaceholder: (params: { bucket: InventoryBucket; equip: boolean }) => void;
  onClickWarnItem: (resolvedItem: ResolvedLoadoutItem) => void;
  onRemoveItem: (resolvedItem: ResolvedLoadoutItem) => void;
  onToggleEquipped: (resolvedItem: ResolvedLoadoutItem) => void;
}) {
  const bucketHash = bucket.hash;
  const [equipped, unequipped] = _.partition(items, (li) => li.loadoutItem.equip);

  const showFashion = LockableBucketHashes.includes(bucketHash);

  const handlePlaceholderClick = (equip: boolean) => onClickPlaceholder({ bucket, equip });

  // TODO: plumb through API from context??
  // T0DO: customize buttons in item popup?
  // TODO: draggable items?

  const maxSlots = singularBucketHashes.includes(bucket.hash) ? 1 : bucket.capacity;
  const showAddUnequipped = equipped.length > 0 && unequipped.length < maxSlots - 1;

  const addUnequipped = showAddUnequipped && (
    <button
      type="button"
      key="addbutton"
      className={styles.addButton}
      onClick={() => handlePlaceholderClick(false)}
      title={t('Loadouts.AddUnequippedItems')}
    >
      <AppIcon icon={addIcon} />
    </button>
  );

  return (
    <div className={clsx(styles.itemBucket, { [styles.showFashion]: showFashion })}>
      {equipped.length > 0 ? (
        <>
          <LoadoutEditItemDropTarget
            bucket={bucket}
            classType={classType}
            equippedItems={equipped}
            unequippedItems={unequipped}
            equip={true}
          >
            <div className={clsx(styles.items, styles.equippedGrid)}>
              {equipped.map((li) => (
                <DraggableRemovableLoadoutItem
                  key={li.item.id}
                  loadoutItem={li}
                  onClickWarnItem={onClickWarnItem}
                  onRemoveItem={onRemoveItem}
                  onToggleEquipped={onToggleEquipped}
                />
              ))}
            </div>
          </LoadoutEditItemDropTarget>
          {equippedContent}
        </>
      ) : (
        <>
          <LoadoutEditItemDropTarget
            bucket={bucket}
            classType={classType}
            equippedItems={equipped}
            unequippedItems={unequipped}
            equip={true}
          >
            <div className={clsx(styles.items, styles.equippedGrid)}>
              <BucketPlaceholder
                bucketHash={bucketHash}
                onClick={() => handlePlaceholderClick(true)}
              />
            </div>
          </LoadoutEditItemDropTarget>
          {equippedContent}
        </>
      )}
      {unequipped.length > 0 ? (
        <div className={styles.unequipped}>
          <LoadoutEditItemDropTarget
            bucket={bucket}
            classType={classType}
            equippedItems={equipped}
            unequippedItems={unequipped}
            equip={false}
          >
            <div className={clsx(styles.items, styles.unequippedGrid)}>
              {/*  eslint-disable-next-line radar/no-identical-functions */}
              {unequipped.map((li) => (
                <DraggableRemovableLoadoutItem
                  key={li.item.id}
                  loadoutItem={li}
                  onClickWarnItem={onClickWarnItem}
                  onRemoveItem={onRemoveItem}
                  onToggleEquipped={onToggleEquipped}
                />
              ))}
            </div>
          </LoadoutEditItemDropTarget>
          {addUnequipped}
        </div>
      ) : (
        addUnequipped && (
          <div className={styles.unequipped}>
            <LoadoutEditItemDropTarget
              bucket={bucket}
              classType={classType}
              equippedItems={equipped}
              unequippedItems={unequipped}
              equip={false}
            >
              {addUnequipped}
            </LoadoutEditItemDropTarget>
          </div>
        )
      )}
    </div>
  );
}

function FashionButton({
  loadout,
  items,
  storeId,
  onModsByBucketUpdated,
}: {
  loadout: Loadout;
  items: ResolvedLoadoutItem[];
  storeId: string;
  onModsByBucketUpdated(modsByBucket: LoadoutParameters['modsByBucket']): void;
}) {
  const [showFashionDrawer, setShowFashionDrawer] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowFashionDrawer(true)}
        className="dim-button loadout-add"
      >
        <AppIcon icon={faTshirt} /> {t('Loadouts.Fashion')}
      </button>
      {showFashionDrawer && (
        <Portal>
          <FashionDrawer
            loadout={loadout}
            items={items}
            storeId={storeId}
            onModsByBucketUpdated={onModsByBucketUpdated}
            onClose={() => setShowFashionDrawer(false)}
          />
        </Portal>
      )}
    </>
  );
}
