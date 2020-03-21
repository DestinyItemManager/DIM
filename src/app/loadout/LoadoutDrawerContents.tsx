import React from 'react';
import { Loadout } from './loadout-types';
import _ from 'lodash';
import { AppIcon, addIcon } from '../shell/icons';
import LoadoutDrawerBucket from './LoadoutDrawerBucket';
import { InventoryBuckets, InventoryBucket } from '../inventory/inventory-buckets';
import { DimItem } from '../inventory/item-types';
import { showItemPicker } from '../item-picker/item-picker';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { t } from 'app/i18next-t';
import { DimStore } from '../inventory/store-types';

const loadoutTypes = [
  'Class',
  'Primary',
  'Special',
  'Heavy',
  'Kinetic',
  'Energy',
  'Power',
  'Helmet',
  'Gauntlets',
  'Chest',
  'Leg',
  'ClassItem',

  'Artifact',
  'Ghost',
  'Consumable',
  'Consumables',
  'Material',
  'Emblem',
  'Emblems',
  'Shader',
  'Emote',
  'Ship',
  'Ships',
  'Vehicle',
  'Horn'
];

// We don't want to prepopulate the loadout with a bunch of cosmetic junk
// like emblems and ships and horns.
export const fromEquippedTypes = [
  'Class',
  'Kinetic',
  'Energy',
  'Power',
  'Primary',
  'Special',
  'Heavy',
  'Helmet',
  'Gauntlets',
  'Chest',
  'Leg',
  'ClassItem',
  'Artifact',
  'Ghost'
];

export default function LoadoutDrawerContents(
  this: void,
  {
    loadout,
    buckets,
    items,
    stores,
    itemSortOrder,
    equip,
    remove,
    add
  }: {
    loadout: Loadout;
    buckets: InventoryBuckets;
    stores: DimStore[];
    items: DimItem[];
    itemSortOrder: string[];
    equip(item: DimItem, e: React.MouseEvent): void;
    remove(item: DimItem, e: React.MouseEvent): void;
    add(item: DimItem, e?: MouseEvent, equip?: boolean): void;
  }
) {
  const itemsByBucket = _.groupBy(items, (i) => i.bucket.id);

  function doFillLoadoutFromEquipped(e: React.MouseEvent) {
    e.preventDefault();
    fillLoadoutFromEquipped(loadout, itemsByBucket, stores, add);
  }

  const availableTypes = _.compact(loadoutTypes.map((type) => buckets.byType[type]));

  const [typesWithItems, typesWithoutItems] = _.partition(
    availableTypes,
    (bucket) => bucket.id && itemsByBucket[bucket.id] && itemsByBucket[bucket.id].length
  );

  const showFillFromEquipped = typesWithoutItems.some((b) => fromEquippedTypes.includes(b.type!));

  return (
    <>
      {typesWithoutItems.length > 0 && (
        <div className="loadout-add-types">
          {showFillFromEquipped && (
            <a className="dim-button loadout-add" onClick={doFillLoadoutFromEquipped}>
              <AppIcon icon={addIcon} /> {t('Loadouts.AddEquippedItems')}
            </a>
          )}
          {typesWithoutItems.map((bucket) => (
            <a
              key={bucket.type}
              onClick={() => pickLoadoutItem(loadout, itemsByBucket, bucket, add)}
              className="dim-button loadout-add"
            >
              <AppIcon icon={addIcon} /> {bucket.name}
            </a>
          ))}
        </div>
      )}
      <div className="loadout-added-items">
        {typesWithItems.map((bucket) => (
          <LoadoutDrawerBucket
            key={bucket.type}
            bucket={bucket}
            loadoutItems={loadout.items}
            items={itemsByBucket[bucket.id] || []}
            itemSortOrder={itemSortOrder}
            pickLoadoutItem={(bucket) => pickLoadoutItem(loadout, itemsByBucket, bucket, add)}
            equip={equip}
            remove={remove}
          />
        ))}
      </div>
    </>
  );
}

async function pickLoadoutItem(
  loadout: Loadout,
  itemsByBucket: { [bucketId: string]: DimItem[] },
  bucket: InventoryBucket,
  add: (item: DimItem, e?: MouseEvent, equip?: boolean) => void
) {
  const loadoutClassType = loadout?.classType;

  function loadoutHasItem(item: DimItem) {
    return loadout && loadout.items.some((i) => i.id === item.id && i.hash === i.hash);
  }

  const hasEquippedItem = (itemsByBucket[bucket.id] || []).some((i) => i.equipped);

  try {
    const { item, equip } = await showItemPicker({
      filterItems: (item: DimItem) =>
        item.bucket.id === bucket.id &&
        (!loadout ||
          loadout.classType === DestinyClass.Unknown ||
          item.classType === loadoutClassType ||
          item.classType === DestinyClass.Unknown) &&
        item.canBeInLoadout() &&
        !loadoutHasItem(item),
      prompt: t('Loadouts.ChooseItem', { name: bucket.name }),
      equip: !hasEquippedItem,

      // don't show information related to selected perks so we don't give the impression
      // that we will update perk selections when applying the loadout
      ignoreSelectedPerks: true
    });

    add(item, undefined, equip);
  } catch (e) {}
}

function fillLoadoutFromEquipped(
  loadout: Loadout,
  itemsByBucket: { [bucketId: string]: DimItem[] },
  stores: DimStore[],
  add: (item: DimItem, e?: MouseEvent, equip?: boolean) => void
) {
  if (!loadout) {
    return;
  }

  // TODO: need to know which character "launched" the builder
  const dimStore =
    (loadout.classType !== DestinyClass.Unknown &&
      stores.find((s) => s.classType === loadout.classType)) ||
    stores.find((s) => s.current)!;

  const items = dimStore.items.filter(
    (item) => item.equipped && item.canBeInLoadout() && fromEquippedTypes.includes(item.type)
  );

  console.log({ items, loadout, dimStore });
  for (const item of items) {
    if (!itemsByBucket[item.bucket.id] || !itemsByBucket[item.bucket.id].some((i) => i.equipped)) {
      add(items[0], undefined, true);
    } else {
      console.log('Skipping', item, { itemsByBucket, bucketId: item.bucket.id });
    }
  }
}
