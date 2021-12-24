import { t } from 'app/i18next-t';
import { SocketOverrides, SocketOverridesForItems } from 'app/inventory/store/override-sockets';
import { getCurrentStore } from 'app/inventory/stores-helpers';
import { itemCanBeInLoadout } from 'app/utils/item-utils';
import { infoLog } from 'app/utils/log';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React, { useMemo } from 'react';
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
import { extractArmorModHashes, fromEquippedTypes } from './loadout-utils';
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
  loadout,
  savedMods,
  buckets,
  items,
  stores,
  equip,
  remove,
  add,
  onUpdateMods,
  onOpenModPicker,
  removeModByHash,
  onApplySocketOverrides,
}: {
  loadout: Loadout;
  savedMods: PluggableInventoryItemDefinition[];
  buckets: InventoryBuckets;
  stores: DimStore[];
  items: DimItem[];
  equip(item: DimItem, e: React.MouseEvent): void;
  remove(item: DimItem, e: React.MouseEvent): void;
  add(item: DimItem, e?: MouseEvent, equip?: boolean): void;
  onUpdateMods(mods: number[]): void;
  onOpenModPicker(): void;
  removeModByHash(itemHash: number): void;
  onApplySocketOverrides(item: DimItem, socketOverrides: SocketOverrides): void;
}) {
  const itemsByBucket = _.groupBy(items, (i) => i.bucket.hash);

  function doFillLoadoutFromEquipped(e: React.MouseEvent) {
    e.preventDefault();
    fillLoadoutFromEquipped(
      loadout,
      itemsByBucket,
      stores,
      add,
      onUpdateMods,
      onApplySocketOverrides
    );
  }
  function doFillLoadOutFromUnequipped(e: React.MouseEvent) {
    e.preventDefault();
    fillLoadoutFromUnequipped(loadout, stores, add);
  }

  const availableTypes = _.compact(loadoutTypes.map((type) => buckets.byType[type]));

  const [typesWithItems, typesWithoutItems] = _.partition(
    availableTypes,
    (bucket) => bucket.hash && itemsByBucket[bucket.hash] && itemsByBucket[bucket.hash].length
  );
  const subclassBucket = buckets.byType.Class;

  const showFillFromEquipped = typesWithoutItems.some((b) => fromEquippedTypes.includes(b.type!));

  const { subclassItems, subclassSocketOverrides } = useMemo(() => {
    const subclassSocketOverrides: SocketOverridesForItems = {};
    const subclassBucket = buckets.byType.Class;
    const subclassItems: DimItem[] =
      (subclassBucket?.hash && itemsByBucket[subclassBucket.hash]) || [];

    for (const item of loadout.items) {
      if (subclassItems.some((subclass) => subclass.id === item.id)) {
        subclassSocketOverrides[item.id] = item.socketOverrides || {};
      }
    }
    return { subclassSocketOverrides, subclassBucket, subclassItems };
  }, [buckets.byType.Class, itemsByBucket, loadout.items]);

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
            key={subclassBucket.type}
            onClick={() => pickLoadoutSubclass(loadout, subclassBucket, subclassItems, add)}
            className="dim-button loadout-add"
          >
            <AppIcon icon={addIcon} /> {subclassBucket.name}
          </a>
        )}
        {typesWithoutItems.length > 0 &&
          typesWithoutItems.map((bucket) => (
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
      </div>
      <div className="loadout-added-items">
        {typesWithItems.map((bucket) =>
          bucket.type === 'Class' ? null : (
            <LoadoutDrawerBucket
              key={bucket.type}
              bucket={bucket}
              loadoutItems={loadout.items}
              items={itemsByBucket[bucket.hash] || []}
              pickLoadoutItem={(bucket) => pickLoadoutItem(loadout, bucket, add)}
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

async function pickLoadoutSubclass(
  loadout: Loadout,
  subclassBucket: InventoryBucket,
  savedSubclasses: DimItem[],
  add: (item: DimItem, e?: MouseEvent) => void
) {
  const loadoutClassType = loadout?.classType;
  function loadoutHasItem(item: DimItem) {
    return loadout?.items.some((i) => i.id === item.id && i.hash === item.hash);
  }
  function loadoutHasSubclassForClass(item: DimItem) {
    return savedSubclasses.some(
      (s) => item.bucket.type === 'Class' && s.classType === item.classType
    );
  }

  try {
    const { item } = await showItemPicker({
      filterItems: (item: DimItem) =>
        item.bucket.type === 'Class' &&
        (!loadout ||
          loadout.classType === DestinyClass.Unknown ||
          item.classType === loadoutClassType) &&
        itemCanBeInLoadout(item) &&
        !loadoutHasSubclassForClass(item) &&
        !loadoutHasItem(item),
      // We can only sort so that the classes are grouped and stasis comes first
      sortBy: (item) => `${item.classType}-${item.energy?.energyType}`,
      prompt: t('Loadouts.ChooseItem', { name: subclassBucket.name }),

      // don't show information related to selected perks so we don't give the impression
      // that we will update perk selections when applying the loadout
      ignoreSelectedPerks: true,
    });

    add(item);
  } catch (e) {}
}

function createSocketOverridesFromEquipped(
  item: DimItem,
  onApplySocketOverrides: (item: DimItem, socketOverrides: SocketOverrides) => void
) {
  const socketOverrides: SocketOverrides = {};
  for (const socket of item.sockets?.allSockets || []) {
    // If the socket is plugged and we plug isn't the initial plug we apply the overrides
    // to the loadout.
    if (
      socket.plugged &&
      socket.plugged.plugDef.hash !== socket.socketDefinition.singleInitialItemHash
    ) {
      socketOverrides[socket.socketIndex] = socket.plugged.plugDef.hash;
    }
  }
  if (Object.keys(socketOverrides).length) {
    onApplySocketOverrides(item, socketOverrides);
  }
}

function fillLoadoutFromEquipped(
  loadout: Loadout,
  itemsByBucket: { [bucketId: string]: DimItem[] },
  stores: DimStore[],
  add: (item: DimItem, e?: MouseEvent, equip?: boolean) => void,
  onUpdateMods: (mods: number[]) => void,
  onApplySocketOverrides: (item: DimItem, socketOverrides: SocketOverrides) => void
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

  const mods: number[] = [];
  for (const item of items) {
    if (
      !itemsByBucket[item.bucket.hash] ||
      !itemsByBucket[item.bucket.hash].some((i) => i.equipped)
    ) {
      add(item, undefined, true);
      if (item.bucket.hash === BucketHashes.Subclass) {
        createSocketOverridesFromEquipped(item, onApplySocketOverrides);
      }
      mods.push(...extractArmorModHashes(item));
    } else {
      infoLog('loadout', 'Skipping', item, { itemsByBucket, bucketId: item.bucket.hash });
    }
  }
  if (mods.length && (loadout.parameters?.mods ?? []).length === 0) {
    onUpdateMods(mods);
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
