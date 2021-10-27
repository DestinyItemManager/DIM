import { t } from 'app/i18next-t';
import { getCurrentStore } from 'app/inventory/stores-helpers';
import { itemCanBeInLoadout } from 'app/utils/item-utils';
import { infoLog } from 'app/utils/log';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import subclassPlugCategoryHashes from 'data/d2/subclass-plug-category-hashes';
import _ from 'lodash';
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import type {
  DimBucketType,
  InventoryBucket,
  InventoryBuckets,
} from '../inventory/inventory-buckets';
import { DimItem, PluggableInventoryItemDefinition } from '../inventory/item-types';
import { DimStore } from '../inventory/store-types';
import { showItemPicker } from '../item-picker/item-picker';
import { addIcon, AppIcon } from '../shell/icons';
import { Loadout } from './loadout-types';
import LoadoutDrawerBucket from './LoadoutDrawerBucket';
import SavedMods from './SavedMods';
import SavedSubclass from './SavedSubclass';
import SubclassDrawer from './subclass-drawer/SubclassDrawer';

const loadoutTypes: DimBucketType[] = [
  'Class',
  'Primary',
  'Special',
  'Heavy',
  'KineticSlot',
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
  'Material',
  'Emblem',
  'Emblems',
  'Shader',
  'Emote',
  'Ship',
  'Ships',
  'Vehicle',
  'Horn',
];

// We don't want to prepopulate the loadout with a bunch of cosmetic junk
// like emblems and ships and horns.
export const fromEquippedTypes: DimBucketType[] = [
  'Class',
  'KineticSlot',
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
  'Ghost',
];

export default function LoadoutDrawerContents(
  this: void,
  {
    loadout,
    savedMods,
    buckets,
    items,
    stores,
    itemSortOrder,
    equip,
    remove,
    add,
    onOpenModPicker,
    onUpdateMods,
    removeModByHash,
  }: {
    loadout: Loadout;
    savedMods: PluggableInventoryItemDefinition[];
    buckets: InventoryBuckets;
    stores: DimStore[];
    items: DimItem[];
    itemSortOrder: string[];
    equip(item: DimItem, e: React.MouseEvent): void;
    remove(item: DimItem, e: React.MouseEvent): void;
    add(item: DimItem, e?: MouseEvent, equip?: boolean): void;
    onUpdateMods(newModHashes: number[]): void;
    onOpenModPicker(): void;
    removeModByHash(itemHash: number): void;
  }
) {
  const itemsByBucket = _.groupBy(items, (i) => i.bucket.hash);
  const [openSubclassDrawer, setOpenSubclassDrawer] = useState(false);

  function doFillLoadoutFromEquipped(e: React.MouseEvent) {
    e.preventDefault();
    fillLoadoutFromEquipped(loadout, itemsByBucket, stores, add);
  }
  function doFillLoadOutFromUnequipped(e: React.MouseEvent) {
    e.preventDefault();
    fillLoadoutFromUnequipped(loadout, stores, add);
  }
  const onSubclassUpdated = (newPlugs: PluggableInventoryItemDefinition[]) => {
    const currentMods = loadout.parameters?.mods || [];
    // Remove all current subclass mods
    const cleanedMods = currentMods.filter((modHash) =>
      subclassPlugCategoryHashes.includes(modHash)
    );
    onUpdateMods([...cleanedMods, ...newPlugs.map((mod) => mod.hash)]);
  };

  const availableTypes = _.compact(loadoutTypes.map((type) => buckets.byType[type]));

  const [typesWithItems, typesWithoutItems] = _.partition(
    availableTypes,
    (bucket) => bucket.hash && itemsByBucket[bucket.hash] && itemsByBucket[bucket.hash].length
  );

  const showFillFromEquipped = typesWithoutItems.some((b) => fromEquippedTypes.includes(b.type!));
  const subclassBucket = availableTypes.find((available) => available.type === 'Class');
  const subclassItems = (subclassBucket?.hash && itemsByBucket[subclassBucket.hash]) || [];

  return (
    <>
      {typesWithoutItems.length > 0 && (
        <div className="loadout-add-types">
          {showFillFromEquipped && (
            <a className="dim-button loadout-add" onClick={doFillLoadoutFromEquipped}>
              <AppIcon icon={addIcon} /> {t('Loadouts.AddEquippedItems')}
            </a>
          )}
          <a className="dim-button loadout-add" onClick={doFillLoadOutFromUnequipped}>
            <AppIcon icon={addIcon} /> {t('Loadouts.AddUnequippedItems')}
          </a>

          {typesWithoutItems.map((bucket) => (
            <a
              key={bucket.type}
              onClick={() => pickLoadoutItem(loadout, bucket, add)}
              className="dim-button loadout-add"
            >
              <AppIcon icon={addIcon} /> {bucket.name}
            </a>
          ))}
          <a onClick={() => onOpenModPicker()} className="dim-button loadout-add">
            <AppIcon icon={addIcon} /> {t('Loadouts.ArmorMods')}
          </a>
          <a onClick={() => setOpenSubclassDrawer(true)} className="dim-button loadout-add">
            <AppIcon icon={addIcon} /> Select Subclass
          </a>
        </div>
      )}
      <div className="loadout-added-items">
        {typesWithItems.map((bucket) => (
          <LoadoutDrawerBucket
            key={bucket.type}
            bucket={bucket}
            loadoutItems={loadout.items}
            items={itemsByBucket[bucket.hash] || []}
            itemSortOrder={itemSortOrder}
            pickLoadoutItem={(bucket) => pickLoadoutItem(loadout, bucket, add)}
            equip={equip}
            remove={remove}
          />
        ))}
      </div>
      <SavedSubclass
        bucket={subclassBucket}
        loadoutItems={loadout.items}
        items={subclassItems}
        equip={equip}
        remove={remove}
      />
      <SavedMods
        savedMods={savedMods}
        onOpenModPicker={onOpenModPicker}
        removeModByHash={removeModByHash}
      />
      {openSubclassDrawer &&
        ReactDOM.createPortal(
          <SubclassDrawer
            classType={loadout.classType}
            onAccept={onSubclassUpdated}
            onClose={() => setOpenSubclassDrawer(false)}
          />,
          document.body
        )}
    </>
  );
}

async function pickLoadoutItem(
  loadout: Loadout,
  bucket: InventoryBucket,
  add: (item: DimItem, e?: MouseEvent) => void
) {
  const loadoutClassType = loadout?.classType;
  function loadoutHasItem(item: DimItem) {
    return loadout?.items.some((i) => i.id === item.id && i.hash === item.hash);
  }

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
    getCurrentStore(stores)!;

  const items = dimStore.items.filter(
    (item) => item.equipped && itemCanBeInLoadout(item) && fromEquippedTypes.includes(item.type)
  );

  for (const item of items) {
    if (
      !itemsByBucket[item.bucket.hash] ||
      !itemsByBucket[item.bucket.hash].some((i) => i.equipped)
    ) {
      add(item, undefined, true);
    } else {
      infoLog('loadout', 'Skipping', item, { itemsByBucket, bucketId: item.bucket.hash });
    }
  }
}

async function fillLoadoutFromUnequipped(
  loadout: Loadout,
  stores: DimStore[],
  add: (item: DimItem, e?: MouseEvent, equip?: boolean) => void
) {
  if (!loadout) {
    return;
  }
  const dimStore =
    (loadout.classType !== DestinyClass.Unknown &&
      stores.find((s) => s.classType === loadout.classType)) ||
    getCurrentStore(stores)!;

  const items = dimStore.items.filter(
    (item) =>
      !item.location.inPostmaster &&
      item.bucket.type !== 'Class' &&
      itemCanBeInLoadout(item) &&
      fromEquippedTypes.includes(item.type) &&
      !item.equipped
  );

  for (const item of items) {
    add(item, undefined, false);
  }
}
