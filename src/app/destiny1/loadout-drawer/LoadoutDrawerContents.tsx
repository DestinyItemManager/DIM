import { t } from 'app/i18next-t';
import type {
  DimBucketType,
  InventoryBucket,
  InventoryBuckets,
} from 'app/inventory/inventory-buckets';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { storesSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { SocketOverrides, SocketOverridesForItems } from 'app/inventory/store/override-sockets';
import { getCurrentStore, getStore } from 'app/inventory/stores-helpers';
import { showItemPicker } from 'app/item-picker/item-picker';
import { pickSubclass } from 'app/loadout/item-utils';
import { Loadout, LoadoutItem } from 'app/loadout/loadout-types';
import {
  createSocketOverridesFromEquipped,
  createSubclassDefaultSocketOverrides,
  extractArmorModHashes,
  fromEquippedTypes,
} from 'app/loadout/loadout-utils';
import { addIcon, AppIcon, faTshirt } from 'app/shell/icons';
import { itemCanBeInLoadout } from 'app/utils/item-utils';
import { infoLog } from 'app/utils/log';
import { getSocketsByCategoryHash } from 'app/utils/socket-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { BucketHashes, SocketCategoryHashes } from 'data/d2/generated-enums';
import produce from 'immer';
import _ from 'lodash';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import LoadoutDrawerBucket from './LoadoutDrawerBucket';
import SavedMods from './SavedMods';
import { Subclass } from './subclass-drawer/Subclass';

const loadoutTypes: DimBucketType[] = [
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
  'Class',
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

export default function LoadoutDrawerContents({
  storeId,
  loadout,
  savedMods,
  buckets,
  items,
  equip,
  remove,
  add,
  onUpdateLoadout,
  onOpenModPicker,
  onShowItemPicker,
  onOpenFashionDrawer,
  removeModByHash,
  onApplySocketOverrides,
}: {
  storeId?: string;
  loadout: Loadout;
  savedMods: PluggableInventoryItemDefinition[];
  buckets: InventoryBuckets;
  items: DimItem[];
  equip(item: DimItem, e: React.MouseEvent): void;
  remove(item: DimItem, e: React.MouseEvent): void;
  add(params: { item: DimItem; equip?: boolean; socketOverrides?: SocketOverrides }): void;
  onUpdateLoadout(loadout: Loadout): void;
  onOpenModPicker(): void;
  onShowItemPicker(shown: boolean): void;
  onOpenFashionDrawer(): void;
  removeModByHash(itemHash: number): void;
  onApplySocketOverrides(item: DimItem, socketOverrides: SocketOverrides): void;
}) {
  const stores = useSelector(storesSelector);
  const itemsByBucket = _.groupBy(items, (i) => i.bucket.hash);

  // The store to use for "fill from equipped/unequipped"
  const dimStore = storeId
    ? getStore(stores, storeId)!
    : (loadout.classType !== DestinyClass.Unknown &&
        stores.find((s) => s.classType === loadout.classType)) ||
      getCurrentStore(stores)!;

  function doFillLoadoutFromEquipped(e: React.MouseEvent) {
    e.preventDefault();
    fillLoadoutFromEquipped(loadout, itemsByBucket, dimStore, onUpdateLoadout);
  }
  function doFillLoadOutFromUnequipped(e: React.MouseEvent) {
    e.preventDefault();
    fillLoadoutFromUnequipped(loadout, dimStore, add);
  }

  const availableTypes = _.compact(loadoutTypes.map((type) => buckets.byType[type]));

  const [typesWithItems, typesWithoutItems] = _.partition(
    availableTypes,
    (bucket) => bucket.hash && itemsByBucket[bucket.hash] && itemsByBucket[bucket.hash].length
  );
  const subclassBucket = buckets.byType.Class;

  const showFillFromEquipped = typesWithoutItems.some((b) => fromEquippedTypes.includes(b.hash));

  const { subclassItems, subclassSocketOverrides } = useMemo(() => {
    const subclassSocketOverrides: SocketOverridesForItems = {};
    const subclassItems = itemsByBucket[BucketHashes.Subclass] ?? [];

    for (const item of loadout.items) {
      if (subclassItems.some((subclass) => subclass.id === item.id)) {
        subclassSocketOverrides[item.id] = item.socketOverrides || {};
      }
    }
    return { subclassSocketOverrides, subclassItems };
  }, [itemsByBucket, loadout.items]);

  const showSubclassButton =
    !loadout ||
    loadout.classType === DestinyClass.Unknown ||
    !subclassItems.length ||
    subclassItems.every((i) => i.classType !== loadout.classType);

  return (
    <>
      <div className="loadout-add-types">
        {showFillFromEquipped && (
          <a className="dim-button loadout-add" onClick={doFillLoadoutFromEquipped}>
            <AppIcon icon={addIcon} /> {t('Loadouts.AddEquippedItems')}
          </a>
        )}
        <a className="dim-button loadout-add" onClick={doFillLoadOutFromUnequipped}>
          <AppIcon icon={addIcon} /> {t('Loadouts.AddUnequippedItems')}
        </a>
        {showSubclassButton && (
          <a
            key={subclassBucket.hash}
            onClick={() => pickLoadoutSubclass(loadout, subclassItems, add, onShowItemPicker)}
            className="dim-button loadout-add"
          >
            <AppIcon icon={addIcon} /> {subclassBucket.name}
          </a>
        )}
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
        <a onClick={() => onOpenModPicker()} className="dim-button loadout-add">
          <AppIcon icon={addIcon} /> {t('Loadouts.ArmorMods')}
        </a>
        {loadout.classType !== DestinyClass.Unknown && (
          <a onClick={() => onOpenFashionDrawer()} className="dim-button loadout-add">
            <AppIcon icon={faTshirt} /> {t('Loadouts.Fashion')}
          </a>
        )}
      </div>
      <div className="loadout-added-items">
        {typesWithItems.map((bucket) =>
          bucket.hash === BucketHashes.Subclass ? null : (
            <LoadoutDrawerBucket
              key={bucket.hash}
              bucket={bucket}
              loadoutItems={loadout.items}
              items={itemsByBucket[bucket.hash] || []}
              pickLoadoutItem={(bucket) => pickLoadoutItem(loadout, bucket, add, onShowItemPicker)}
              equip={equip}
              remove={remove}
            />
          )
        )}
      </div>
      {subclassItems.length > 0 &&
        subclassItems.map((subclass) => (
          <Subclass
            key={subclass.hash}
            subclass={subclass}
            socketOverrides={subclassSocketOverrides[subclass.id]}
            equip={equip}
            remove={remove}
            onApplySocketOverrides={onApplySocketOverrides}
          />
        ))}
      <SavedMods
        savedMods={savedMods}
        onOpenModPicker={onOpenModPicker}
        removeModByHash={removeModByHash}
      />
    </>
  );
}

export async function pickLoadoutItem(
  loadout: Loadout,
  bucket: InventoryBucket,
  add: (params: { item: DimItem }) => void,
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

    add({ item });
  } catch (e) {
  } finally {
    onShowItemPicker(false);
  }
}

export async function pickLoadoutSubclass(
  loadout: Loadout,
  savedSubclasses: DimItem[],
  add: (params: { item: DimItem; socketOverrides?: SocketOverrides }) => void,
  onShowItemPicker: (shown: boolean) => void
) {
  const loadoutClassType = loadout?.classType;
  const loadoutHasItem = (item: DimItem) =>
    loadout?.items.some((i) => i.id === item.id && i.hash === item.hash);

  const loadoutHasSubclassForClass = (item: DimItem) =>
    savedSubclasses.some(
      (s) => item.bucket.hash === BucketHashes.Subclass && s.classType === item.classType
    );

  const subclassItemFilter = (item: DimItem) =>
    item.bucket.hash === BucketHashes.Subclass &&
    (!loadout ||
      loadout.classType === DestinyClass.Unknown ||
      item.classType === loadoutClassType) &&
    itemCanBeInLoadout(item) &&
    !loadoutHasSubclassForClass(item) &&
    !loadoutHasItem(item);

  onShowItemPicker(true);
  const item = await pickSubclass(subclassItemFilter);
  if (item) {
    let socketOverrides: SocketOverrides | undefined;
    if (item.bucket.hash === BucketHashes.Subclass) {
      socketOverrides = createSubclassDefaultSocketOverrides(item);
    }

    add({ item, socketOverrides });
  }
  onShowItemPicker(false);
}

/** Replace the loadout's subclass with the currently equipped subclass */
export function setLoadoutSubclassFromEquipped(
  loadout: Loadout,
  existingSubclass: DimItem | undefined,
  dimStore: DimStore,
  onUpdateLoadout: (loadout: Loadout) => void
) {
  if (!loadout) {
    return;
  }

  const newSubclass = dimStore.items.find(
    (item) =>
      item.equipped && itemCanBeInLoadout(item) && item.bucket.hash === BucketHashes.Subclass
  );

  if (!newSubclass) {
    return;
  }

  const newLoadoutItem: LoadoutItem = {
    id: newSubclass.id,
    hash: newSubclass.hash,
    equip: true,
    amount: 1,
    socketOverrides: createSocketOverridesFromEquipped(newSubclass),
  };

  const newLoadout = {
    ...loadout,
    items: [...loadout.items.filter((i) => existingSubclass?.hash !== i.hash), newLoadoutItem],
  };

  onUpdateLoadout(newLoadout);
}

export function fillLoadoutFromEquipped(
  loadout: Loadout,
  itemsByBucket: { [bucketId: string]: DimItem[] },
  dimStore: DimStore,
  onUpdateLoadout: (loadout: Loadout) => void,
  // This is a bit dangerous as it is only used from the new loadout edit drawer and
  // has special handling that would break the old loadout drawer
  category?: string
) {
  if (!loadout) {
    return;
  }

  const newEquippedItems = dimStore.items.filter(
    (item) =>
      item.equipped &&
      itemCanBeInLoadout(item) &&
      (category
        ? category === 'General'
          ? item.bucket.hash !== BucketHashes.Subclass && item.bucket.sort === category
          : item.bucket.sort === category
        : fromEquippedTypes.includes(item.bucket.hash))
  );

  const hasEquippedInBucket = (bucket: InventoryBucket) =>
    itemsByBucket[bucket.hash]?.some(
      (bucketItem) =>
        loadout.items.find(
          (loadoutItem) => bucketItem.hash === loadoutItem.hash && bucketItem.id === loadoutItem.id
        )?.equip
    );

  const newLoadout = produce(loadout, (draftLoadout) => {
    const mods: number[] = [];
    for (const item of newEquippedItems) {
      if (!hasEquippedInBucket(item.bucket)) {
        const loadoutItem: LoadoutItem = {
          id: item.id,
          hash: item.hash,
          equip: true,
          amount: 1,
        };
        if (item.bucket.hash === BucketHashes.Subclass) {
          loadoutItem.socketOverrides = createSocketOverridesFromEquipped(item);
        }
        draftLoadout.items.push(loadoutItem);
        mods.push(...extractArmorModHashes(item));
      } else {
        infoLog('loadout', 'Skipping', item, { itemsByBucket, bucketId: item.bucket.hash });
      }
    }
    if (mods.length && (loadout.parameters?.mods ?? []).length === 0) {
      draftLoadout.parameters = {
        ...draftLoadout.parameters,
        mods,
      };
    }
    // Save "fashion" mods for equipped items
    const modsByBucket = {};
    for (const item of newEquippedItems.filter((i) => i.bucket.inArmor)) {
      const plugs = item.sockets
        ? _.compact(
            getSocketsByCategoryHash(item.sockets, SocketCategoryHashes.ArmorCosmetics).map(
              (s) => s.plugged?.plugDef.hash
            )
          )
        : [];
      if (plugs.length) {
        modsByBucket[item.bucket.hash] = plugs;
      }
    }
    if (!_.isEmpty(modsByBucket)) {
      draftLoadout.parameters = {
        ...draftLoadout.parameters,
        modsByBucket,
      };
    }
  });

  onUpdateLoadout(newLoadout);
}

export async function fillLoadoutFromUnequipped(
  loadout: Loadout,
  dimStore: DimStore,
  add: (params: { item: DimItem; equip?: boolean }) => void,
  category?: string
) {
  if (!loadout) {
    return;
  }

  const items = getUnequippedItemsForLoadout(dimStore, category);

  // TODO: this isn't right - `items` isn't being updated after each add
  for (const item of items) {
    add({ item, equip: false });
  }
}

/**
 * filter for items that are in a character's "pockets" but not equipped,
 * and can be added to a loadout
 */
export function getUnequippedItemsForLoadout(dimStore: DimStore, category?: string) {
  return dimStore.items.filter(
    (item) =>
      !item.location.inPostmaster &&
      item.bucket.hash !== BucketHashes.Subclass &&
      itemCanBeInLoadout(item) &&
      (category ? item.bucket.sort === category : fromEquippedTypes.includes(item.bucket.hash)) &&
      !item.equipped
  );
}
