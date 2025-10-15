import { LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import ClosableContainer from 'app/dim-ui/ClosableContainer';
import { t } from 'app/i18next-t';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import DraggableInventoryItem from 'app/inventory/DraggableInventoryItem';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { InventoryBucket } from 'app/inventory/inventory-buckets';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { bucketsSelector, storesSelector } from 'app/inventory/selectors';
import { singularBucketHashes } from 'app/loadout-drawer/loadout-utils';
import { Loadout, ResolvedLoadoutItem } from 'app/loadout/loadout-types';
import { AppIcon, addIcon, faTshirt } from 'app/shell/icons';
import { LoadoutCharacterStats } from 'app/store-stats/CharacterStats';
import { emptyArray } from 'app/utils/empty';
import { LookupTable } from 'app/utils/util-types';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import { partition } from 'es-toolkit';
import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import '../../inventory-page/StoreBucket.scss';
import FashionDrawer from '../fashion/FashionDrawer';
import { BucketPlaceholder } from '../loadout-ui/BucketPlaceholder';
import { FashionMods } from '../loadout-ui/FashionMods';
import LoadoutParametersDisplay from '../loadout-ui/LoadoutParametersDisplay';
import { OptimizerButton, armorItemsMissing } from '../loadout-ui/OptimizerButton';
import * as styles from './LoadoutEditBucket.m.scss';
import { useEquipDropTargets } from './useEquipDropTargets';

export type EditableCategories = 'Weapons' | 'Armor' | 'General';

const categoryStyles: LookupTable<EditableCategories, string> = {
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
  category: EditableCategories;
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
  const itemsByBucket = Object.groupBy(items ?? [], (li) => li.item.bucket.hash);
  const bucketOrder =
    category === 'Weapons' || category === 'Armor'
      ? buckets.byCategory[category]
      : [BucketHashes.Ghost, BucketHashes.Emblems, BucketHashes.Ships, BucketHashes.Vehicle].map(
          (h) => buckets.byHash[h],
        );
  const isArmor = category === 'Armor';

  return (
    <div className={clsx(styles.itemCategory, categoryStyles[category])}>
      <div className={styles.itemsInCategory}>
        {bucketOrder.map((bucket) => (
          <ItemBucket
            key={bucket.hash}
            bucket={bucket}
            classType={classType}
            items={itemsByBucket[bucket.hash] ?? emptyArray()}
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
  onModsByBucketUpdated: (modsByBucket: LoadoutParameters['modsByBucket']) => void;
}) {
  const equippedItems =
    items?.filter((li) => li.loadoutItem.equip && !li.missing).map((li) => li.item) ?? [];
  const anyMissing = armorItemsMissing(items);

  return (
    <>
      {equippedItems.length === 5 && (
        <LoadoutCharacterStats
          loadout={loadout}
          subclass={subclass}
          allMods={allMods}
          items={items}
        />
      )}
      {loadout.parameters && <LoadoutParametersDisplay params={loadout.parameters} />}
      <div className={styles.buttons}>
        <FashionButton
          loadout={loadout}
          items={items ?? emptyArray()}
          storeId={storeId}
          onModsByBucketUpdated={onModsByBucketUpdated}
        />
        <OptimizerButton loadout={loadout} storeId={storeId} missingArmor={anyMissing} />
      </div>
    </>
  );
}

function ItemBucket({
  bucket,
  classType,
  items,
  equippedContent,
  onClickPlaceholder,
  onClickWarnItem,
  onRemoveItem,
  onToggleEquipped,
}: {
  bucket: InventoryBucket;
  classType: DestinyClass;
  items: ResolvedLoadoutItem[];
  equippedContent?: React.ReactNode;
  onClickPlaceholder: (params: { bucket: InventoryBucket; equip: boolean }) => void;
  onClickWarnItem: (resolvedItem: ResolvedLoadoutItem) => void;
  onRemoveItem: (resolvedItem: ResolvedLoadoutItem) => void;
  onToggleEquipped: (resolvedItem: ResolvedLoadoutItem) => void;
}) {
  const bucketHash = bucket.hash;
  const [equipped, unequipped] = partition(items, (li) => li.loadoutItem.equip);

  const stores = useSelector(storesSelector);
  const acceptTarget = useMemo(
    () => [bucket.hash.toString(), ...stores.flatMap((store) => `${store.id}-${bucket.hash}`)],
    [bucket, stores],
  );
  const {
    equippedRef,
    unequippedRef,
    isOverEquipped,
    isOverUnequipped,
    canDropEquipped,
    canDropUnequipped,
  } = useEquipDropTargets(acceptTarget, classType);

  const handlePlaceholderClick = (equip: boolean) => onClickPlaceholder({ bucket, equip });

  // TODO: plumb through API from context??
  // T0DO: customize buttons in item popup?
  // TODO: draggable items?

  const maxSlots = singularBucketHashes.includes(bucket.hash) ? 1 : bucket.capacity;
  const showAddUnequipped = equipped.length > 0 && unequipped.length < maxSlots - 1;

  const addUnequipped = showAddUnequipped && (
    <AddItemButton
      key="addbutton"
      onClick={() => handlePlaceholderClick(false)}
      title={t('Loadouts.AddUnequippedItems')}
    />
  );

  const renderItem = (li: ResolvedLoadoutItem) => (
    <DraggableItem
      key={li.item.id}
      resolvedLoadoutItem={li}
      onClickWarnItem={() => onClickWarnItem(li)}
      onRemoveItem={() => onRemoveItem(li)}
      onToggleEquipped={() => onToggleEquipped(li)}
    />
  );

  return (
    <div className={styles.itemBucket}>
      <div
        ref={(el) => {
          equippedRef(el);
        }}
        className={clsx({
          [styles.canDrop]: canDropEquipped,
          [styles.isOver]: isOverEquipped,
        })}
      >
        {equipped.length > 0 ? (
          <div className={clsx(styles.items, styles.equipped)}>
            {equipped.map(renderItem)}
            {equippedContent}
          </div>
        ) : (
          <div className={clsx(styles.items, styles.equipped)}>
            <BucketPlaceholder
              bucketHash={bucketHash}
              onClick={() => handlePlaceholderClick(true)}
            />
            {equippedContent}
          </div>
        )}
      </div>
      <div
        ref={(el) => {
          unequippedRef(el);
        }}
        className={clsx({
          [styles.canDrop]: canDropUnequipped,
          [styles.isOver]: isOverUnequipped,
        })}
      >
        {unequipped.length > 0 ? (
          <div
            ref={(el) => {
              unequippedRef(el);
            }}
            className={clsx(styles.items, styles.unequipped)}
          >
            {unequipped.map(renderItem)}
            {addUnequipped}
          </div>
        ) : (
          addUnequipped
        )}
      </div>
    </div>
  );
}

function DraggableItem({
  resolvedLoadoutItem,
  onClickWarnItem,
  onRemoveItem,
  onToggleEquipped,
}: {
  resolvedLoadoutItem: ResolvedLoadoutItem;
  onClickWarnItem: () => void;
  onRemoveItem: () => void;
  onToggleEquipped: () => void;
}) {
  return (
    <ClosableContainer key={resolvedLoadoutItem.item.id} onClose={onRemoveItem}>
      <DraggableInventoryItem item={resolvedLoadoutItem.item}>
        <ItemPopupTrigger
          item={resolvedLoadoutItem.item}
          extraData={{ socketOverrides: resolvedLoadoutItem.loadoutItem.socketOverrides }}
        >
          {(ref, onClick) => (
            <div
              className={clsx({
                [styles.missingItem]: resolvedLoadoutItem.missing,
              })}
            >
              <ConnectedInventoryItem
                item={resolvedLoadoutItem.item}
                ref={ref}
                onClick={resolvedLoadoutItem.missing ? onClickWarnItem : onClick}
                onDoubleClick={onToggleEquipped}
              />
            </div>
          )}
        </ItemPopupTrigger>
      </DraggableInventoryItem>
    </ClosableContainer>
  );
}

export function AddItemButton({
  onClick,
  title,
}: {
  onClick: React.MouseEventHandler;
  title: string;
}) {
  return (
    <button type="button" className={styles.addButton} onClick={onClick} title={title}>
      <AppIcon icon={addIcon} />
    </button>
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
  onModsByBucketUpdated: (modsByBucket: LoadoutParameters['modsByBucket']) => void;
}) {
  const [showFashionDrawer, setShowFashionDrawer] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setShowFashionDrawer(true)} className="dim-button">
        <AppIcon icon={faTshirt} /> {t('Loadouts.Fashion')}
      </button>
      {showFashionDrawer && (
        <FashionDrawer
          loadout={loadout}
          items={items}
          storeId={storeId}
          onModsByBucketUpdated={onModsByBucketUpdated}
          onClose={() => setShowFashionDrawer(false)}
        />
      )}
    </>
  );
}
