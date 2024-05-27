import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import type { InventoryBucket } from 'app/inventory/inventory-buckets';
import { DimItem } from 'app/inventory/item-types';
import { bucketsSelector, storesSelector } from 'app/inventory/selectors';
import { getStore } from 'app/inventory/stores-helpers';
import { ShowItemPickerFn, useItemPicker } from 'app/item-picker/item-picker';
import {
  LoadoutUpdateFunction,
  fillLoadoutFromEquipped,
  fillLoadoutFromUnequipped,
} from 'app/loadout-drawer/loadout-drawer-reducer';
import { findSameLoadoutItemIndex, fromEquippedTypes } from 'app/loadout-drawer/loadout-utils';
import { Loadout, ResolvedLoadoutItem } from 'app/loadout/loadout-types';
import { useD1Definitions } from 'app/manifest/selectors';
import { D1BucketHashes } from 'app/search/d1-known-values';
import { AppIcon, addIcon } from 'app/shell/icons';
import { filterMap } from 'app/utils/collections';
import { isItemLoadoutCompatible, itemCanBeInLoadout } from 'app/utils/item-utils';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React from 'react';
import { useSelector } from 'react-redux';
import { D1ManifestDefinitions } from '../d1-definitions';
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
  items,
  equip,
  remove,
  add,
  setLoadout,
}: {
  storeId: string;
  loadout: Loadout;
  items: ResolvedLoadoutItem[];
  setLoadout: (updater: LoadoutUpdateFunction) => void;
  equip: (resolvedItem: ResolvedLoadoutItem, e: React.MouseEvent) => void;
  remove: (resolvedItem: ResolvedLoadoutItem, e: React.MouseEvent) => void;
  add: (item: DimItem, equip?: boolean) => void;
}) {
  const defs = useD1Definitions()!;
  const buckets = useSelector(bucketsSelector)!;
  const stores = useSelector(storesSelector);

  // The store to use for "fill from equipped/unequipped"
  const dimStore = getStore(stores, storeId)!;

  const doFillLoadoutFromEquipped = () =>
    setLoadout(fillLoadoutFromEquipped(defs, dimStore, undefined));

  const doFillLoadOutFromUnequipped = () => setLoadout(fillLoadoutFromUnequipped(defs, dimStore));

  const availableTypes = filterMap(loadoutTypes, (h) => buckets.byHash[h]);
  const itemsByBucket = Object.groupBy(items, (li) => li.item.bucket.hash);

  const [typesWithItems, typesWithoutItems] = _.partition(
    availableTypes,
    (bucket) => bucket.hash && itemsByBucket[bucket.hash]?.length,
  );

  const showFillFromEquipped = typesWithoutItems.some((b) => fromEquippedTypes.includes(b.hash));
  const showItemPicker = useItemPicker();

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
              onClick={() => pickLoadoutItem(defs, loadout, bucket, add, showItemPicker)}
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
            pickLoadoutItem={(bucket) =>
              pickLoadoutItem(defs, loadout, bucket, add, showItemPicker)
            }
            equip={equip}
            remove={remove}
          />
        ))}
      </div>
    </>
  );
}

async function pickLoadoutItem(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  loadout: Loadout,
  bucket: InventoryBucket,
  add: (item: DimItem) => void,
  showItemPicker: ShowItemPickerFn,
) {
  const loadoutHasItem = (item: DimItem) =>
    findSameLoadoutItemIndex(defs, loadout.items, item) !== -1;

  const item = await showItemPicker({
    filterItems: (item: DimItem) =>
      item.bucket.hash === bucket.hash &&
      isItemLoadoutCompatible(item.classType, loadout.classType) &&
      itemCanBeInLoadout(item) &&
      !loadoutHasItem(item),
    prompt: t('Loadouts.ChooseItem', { name: bucket.name }),
  });

  if (item) {
    add(item);
  }
}
