import { t } from 'app/i18next-t';
import type { InventoryBucket, InventoryBuckets } from 'app/inventory/inventory-buckets';
import { DimItem } from 'app/inventory/item-types';
import { storesSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { getCurrentStore, getStore } from 'app/inventory/stores-helpers';
import { showItemPicker } from 'app/item-picker/item-picker';
import { Loadout, LoadoutItem, ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import { fromEquippedTypes } from 'app/loadout-drawer/loadout-utils';
import { D1BucketHashes } from 'app/search/d1-known-values';
import { addIcon, AppIcon } from 'app/shell/icons';
import { itemCanBeInLoadout } from 'app/utils/item-utils';
import { infoLog } from 'app/utils/log';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import produce from 'immer';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import LoadoutDrawerBucket from './LoadoutDrawerBucket';

const loadoutTypes: (BucketHashes | D1BucketHashes)[] = [
  BucketHashes.Subclass,
  BucketHashes.KineticWeapons,
  BucketHashes.EnergyWeapons,
  BucketHashes.PowerWeapons,
  BucketHashes.Helmet,
  BucketHashes.Gauntlets,
  BucketHashes.ChestArmor,
  BucketHashes.LegArmor,
  BucketHashes.ClassArmor,
  D1BucketHashes.Artifact,
  BucketHashes.Ghost,
  BucketHashes.Consumables,
  BucketHashes.Materials,
  BucketHashes.Emblems,
  D1BucketHashes.Shader,
  BucketHashes.Emotes_Invisible,
  BucketHashes.Emotes_Equippable,
  BucketHashes.Ships,
  BucketHashes.Vehicle,
  D1BucketHashes.Horn,
];

export default function LoadoutDrawerContents({
  storeId,
  loadout,
  buckets,
  items,
  equip,
  remove,
  add,
  onUpdateLoadout,
  onShowItemPicker,
}: {
  storeId?: string;
  loadout: Loadout;
  buckets: InventoryBuckets;
  items: ResolvedLoadoutItem[];
  equip(item: DimItem, e: React.MouseEvent): void;
  remove(resolvedItem: ResolvedLoadoutItem, e: React.MouseEvent): void;
  add(item: DimItem, equip?: boolean): void;
  onUpdateLoadout(loadout: Loadout): void;
  onShowItemPicker(shown: boolean): void;
}) {
  const stores = useSelector(storesSelector);

  // The store to use for "fill from equipped/unequipped"
  const dimStore = storeId
    ? getStore(stores, storeId)!
    : (loadout.classType !== DestinyClass.Unknown &&
        stores.find((s) => s.classType === loadout.classType)) ||
      getCurrentStore(stores)!;

  const doFillLoadoutFromEquipped = () =>
    fillLoadoutFromEquipped(
      loadout,
      items.map((li) => li.item),
      dimStore,
      onUpdateLoadout
    );
  const doFillLoadOutFromUnequipped = () => fillLoadoutFromUnequipped(loadout, dimStore, add);

  const availableTypes = _.compact(loadoutTypes.map((h) => buckets.byHash[h]));
  const itemsByBucket = _.groupBy(items, (li) => li.item.bucket.hash);

  const [typesWithItems, typesWithoutItems] = _.partition(
    availableTypes,
    (bucket) => bucket.hash && itemsByBucket[bucket.hash]?.length
  );

  const showFillFromEquipped = typesWithoutItems.some((b) => fromEquippedTypes.includes(b.hash));

  return (
    <>
      <div className="loadout-add-types">
        {showFillFromEquipped && (
          <button
            type="button"
            className="dim-button loadout-add"
            onClick={doFillLoadoutFromEquipped}
          >
            <AppIcon icon={addIcon} /> {t('Loadouts.AddEquippedItems')}
          </button>
        )}
        <button
          type="button"
          className="dim-button loadout-add"
          onClick={doFillLoadOutFromUnequipped}
        >
          <AppIcon icon={addIcon} /> {t('Loadouts.AddUnequippedItems')}
        </button>
        {typesWithoutItems.length > 0 &&
          typesWithoutItems.map((bucket) => (
            <a
              key={bucket.hash}
              onClick={() => pickLoadoutItem(loadout, bucket, add, onShowItemPicker)}
              className="dim-button loadout-add"
            >
              <AppIcon icon={addIcon} /> {bucket.name}
            </a>
          ))}
      </div>
      <div className="loadout-added-items">
        {typesWithItems.map((bucket) => (
          <LoadoutDrawerBucket
            key={bucket.hash}
            bucket={bucket}
            items={itemsByBucket[bucket.hash] || []}
            pickLoadoutItem={(bucket) => pickLoadoutItem(loadout, bucket, add, onShowItemPicker)}
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
  bucket: InventoryBucket,
  add: (item: DimItem) => void,
  onShowItemPicker: (shown: boolean) => void
) {
  const loadoutClassType = loadout?.classType;
  function loadoutHasItem(item: DimItem) {
    return loadout?.items.some((i) => i.id === item.id && i.hash === item.hash);
  }

  onShowItemPicker(true);
  try {
    const { item } = await showItemPicker({
      filterItems: (item: DimItem) =>
        item.bucket.hash === bucket.hash &&
        (!loadout ||
          loadout.classType === DestinyClass.Unknown ||
          item.classType === loadoutClassType ||
          item.classType === DestinyClass.Unknown) &&
        itemCanBeInLoadout(item) &&
        !loadoutHasItem(item),
      prompt: t('Loadouts.ChooseItem', { name: bucket.name }),

      // don't show information related to selected perks so we don't give the impression
      // that we will update perk selections when applying the loadout
      ignoreSelectedPerks: true,
    });

    add(item);
  } catch (e) {
  } finally {
    onShowItemPicker(false);
  }
}

function fillLoadoutFromEquipped(
  loadout: Loadout,
  items: DimItem[],
  dimStore: DimStore,
  onUpdateLoadout: (loadout: Loadout) => void
) {
  if (!loadout) {
    return;
  }
  const itemsByBucket = _.groupBy(items, (i) => i.bucket.hash);

  const newEquippedItems = dimStore.items.filter(
    (item) =>
      item.equipped && itemCanBeInLoadout(item) && fromEquippedTypes.includes(item.bucket.hash)
  );

  const hasEquippedInBucket = (bucket: InventoryBucket) =>
    itemsByBucket[bucket.hash]?.some(
      (bucketItem) =>
        loadout.items.find(
          (loadoutItem) => bucketItem.hash === loadoutItem.hash && bucketItem.id === loadoutItem.id
        )?.equip
    );

  const newLoadout = produce(loadout, (draftLoadout) => {
    for (const item of newEquippedItems) {
      if (!hasEquippedInBucket(item.bucket)) {
        const loadoutItem: LoadoutItem = {
          id: item.id,
          hash: item.hash,
          equip: true,
          amount: 1,
        };
        draftLoadout.items.push(loadoutItem);
      } else {
        infoLog('loadout', 'Skipping', item, { itemsByBucket, bucketId: item.bucket.hash });
      }
    }
  });

  onUpdateLoadout(newLoadout);
}

async function fillLoadoutFromUnequipped(
  loadout: Loadout,
  dimStore: DimStore,
  add: (item: DimItem, equip?: boolean) => void,
  category?: string
) {
  if (!loadout) {
    return;
  }

  const items = getUnequippedItemsForLoadout(dimStore, category);

  // TODO: this isn't right - `items` isn't being updated after each add
  for (const item of items) {
    add(item, false);
  }
}

/**
 * filter for items that are in a character's "pockets" but not equipped,
 * and can be added to a loadout
 */
function getUnequippedItemsForLoadout(dimStore: DimStore, category?: string) {
  return dimStore.items.filter(
    (item) =>
      !item.location.inPostmaster &&
      item.bucket.hash !== BucketHashes.Subclass &&
      itemCanBeInLoadout(item) &&
      (category ? item.bucket.sort === category : fromEquippedTypes.includes(item.bucket.hash)) &&
      !item.equipped
  );
}
