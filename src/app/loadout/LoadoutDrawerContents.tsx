import React from 'react';
import { Loadout, loadoutClassToClassType, LoadoutClass } from './loadout-types';
import _ from 'lodash';
import { AppIcon, addIcon } from '../shell/icons';
import LoadoutDrawerBucket from './LoadoutDrawerBucket';
import { InventoryBuckets, InventoryBucket } from '../inventory/inventory-buckets';
import { DimItem } from '../inventory/item-types';
import { showItemPicker } from '../item-picker/item-picker';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { t } from 'app/i18next-t';
import { filterLoadoutToEquipped } from './LoadoutPopup';
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
const fromEquippedTypes = [
  'class',
  'kinetic',
  'energy',
  'power',
  'primary',
  'special',
  'heavy',
  'helmet',
  'gauntlets',
  'chest',
  'leg',
  'classitem',
  'artifact',
  'ghost'
];

export default function LoadoutDrawerContents(
  this: void,
  {
    loadout,
    buckets,
    stores,
    itemSortOrder,
    equip,
    remove,
    add
  }: {
    loadout: Loadout;
    buckets: InventoryBuckets;
    stores: DimStore[];
    itemSortOrder: string[];
    equip(item: DimItem, e: React.MouseEvent): void;
    remove(item: DimItem, e: React.MouseEvent): void;
    add(item: DimItem, e?: MouseEvent, equip?: boolean): void;
  }
) {
  function doFillLoadoutFromEquipped(e: React.MouseEvent) {
    e.preventDefault();
    fillLoadoutFromEquipped(loadout, stores, add);
  }

  const availableTypes = _.compact(loadoutTypes.map((type) => buckets.byType[type]));

  const [typesWithItems, typesWithoutItems] = _.partition(
    availableTypes,
    (bucket) =>
      bucket.type &&
      loadout.items[bucket.type.toLowerCase()] &&
      loadout.items[bucket.type.toLowerCase()].length
  );

  const showFillFromEquipped = typesWithoutItems.some((b) =>
    fromEquippedTypes.includes(b.type!.toLowerCase())
  );

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
              onClick={() => pickLoadoutItem(loadout, bucket, add)}
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
            loadout={loadout}
            itemSortOrder={itemSortOrder}
            pickLoadoutItem={(bucket) => pickLoadoutItem(loadout, bucket, add)}
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
  add: (item: DimItem, e?: MouseEvent, equip?: boolean) => void
) {
  const loadoutClassType = loadout && loadoutClassToClassType[loadout.classType];

  function loadoutHasItem(item: DimItem) {
    return (
      loadout &&
      loadout.items[item.bucket.type!.toLowerCase()] &&
      loadout.items[item.bucket.type!.toLowerCase()].some((i) => i.id === item.id)
    );
  }

  const hasEquippedItem = (loadout.items[bucket.type!.toLowerCase()] || []).some((i) => i.equipped);

  try {
    const { item, equip } = await showItemPicker({
      filterItems: (item: DimItem) =>
        item.bucket.id === bucket.id &&
        (!loadout ||
          loadout.classType === LoadoutClass.any ||
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
  stores: DimStore[],
  add: (item: DimItem, e?: MouseEvent, equip?: boolean) => void
) {
  if (!loadout) {
    return;
  }

  const loadoutClass = loadout && loadoutClassToClassType[loadout.classType];

  // TODO: need to know which character "launched" the builder
  const dimStore =
    (loadoutClass !== DestinyClass.Unknown && stores.find((s) => s.classType === loadoutClass)) ||
    stores.find((s) => s.current)!;

  const equippedLoadout = filterLoadoutToEquipped(dimStore.loadoutFromCurrentlyEquipped(''));
  equippedLoadout.items = _.pick(equippedLoadout.items, ...fromEquippedTypes);

  _.forIn(equippedLoadout.items, (items, type) => {
    if (items.length && (!loadout.items[type] || !loadout.items[type].some((i) => i.equipped))) {
      add(items[0], undefined, true);
    }
  });
}
