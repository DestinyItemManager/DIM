import { InventoryBucket } from 'app/inventory/inventory-buckets';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { allItemsSelector, bucketsSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { Action } from 'app/loadout-drawer/loadout-drawer-reducer';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import {
  extractArmorModHashes,
  getLight,
  getModsFromLoadout,
} from 'app/loadout-drawer/loadout-utils';
import {
  fillLoadoutFromEquipped,
  fillLoadoutFromUnequipped,
} from 'app/loadout-drawer/LoadoutDrawerContents';
import LoadoutMods from 'app/loadout/loadout-ui/LoadoutMods';
import LoadoutSubclassSection from 'app/loadout/loadout-ui/LoadoutSubclassSection';
import { getItemsAndSubclassFromLoadout } from 'app/loadout/LoadoutView';
import { useD2Definitions } from 'app/manifest/selectors';
import { itemCanBeInLoadout } from 'app/utils/item-utils';
import { BucketHashes } from 'data/d2/generated-enums';
import _ from 'lodash';
import React, { useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import styles from './LoadoutEdit.m.scss';
import LoadoutEditBucket from './LoadoutEditBucket';
import LoadoutEditSection from './LoadoutEditSection';

export default function LoadoutEdit({
  loadout,
  store,
  stateDispatch,
  onClickPlaceholder,
  onClickWarnItem,
  onRemoveItem,
}: {
  loadout: Loadout;
  store: DimStore;
  stateDispatch: React.Dispatch<Action>;
  onClickPlaceholder: (params: { bucket: InventoryBucket }) => void;
  onClickWarnItem: (item: DimItem) => void;
  onRemoveItem: (item: DimItem) => void;
}) {
  const defs = useD2Definitions()!;
  const buckets = useSelector(bucketsSelector)!;
  const allItems = useSelector(allItemsSelector);

  // Turn loadout items into real DimItems, filtering out unequippable items
  const [items, subclass, warnitems] = useMemo(
    () => getItemsAndSubclassFromLoadout(loadout.items, store, defs, buckets, allItems),
    [loadout.items, defs, buckets, allItems, store]
  );

  const itemsByBucket = _.groupBy(items, (i) => i.bucket.hash);

  const savedMods = useMemo(() => getModsFromLoadout(defs, loadout), [defs, loadout]);
  // TODO: filter down by usable mods?
  const modsByBucket = loadout.parameters?.modsByBucket ?? {};
  const equippedItemIds = new Set(loadout.items.filter((i) => i.equipped).map((i) => i.id));

  const categories = _.groupBy(items.concat(warnitems), (i) => i.bucket.sort);

  const showPower = categories.Weapons?.length === 3 && categories.Armor?.length === 5;
  const power = showPower
    ? Math.floor(getLight(store, [...categories.Weapons, ...categories.Armor]))
    : 0;

  /** Updates the loadout replacing it's current mods with all the mods in newMods. */
  const handleUpdateModHashes = (mods: number[]) => stateDispatch({ type: 'updateMods', mods });
  const handleUpdateMods = (newMods: PluggableInventoryItemDefinition[]) =>
    handleUpdateModHashes(newMods.map((mod) => mod.hash));
  const handleClearMods = () => handleUpdateMods([]);

  const handleClearCategory = (category: string) => {
    // TODO: do these all in one action
    for (const item of items.concat(warnitems)) {
      if (item.bucket.sort === category && item.bucket.hash !== BucketHashes.Subclass) {
        stateDispatch({ type: 'removeItem', item, items, shift: false });
      }
    }
  };

  const handleClearSubclass = () => {
    // TODO: do these all in one action
    if (subclass) {
      stateDispatch({ type: 'removeItem', item: subclass, items, shift: false });
    }
  };

  const updateLoadout = (loadout: Loadout) => {
    stateDispatch({ type: 'update', loadout });
  };

  const onAddItem = useCallback(
    ({ item, equip }: { item: DimItem; equip?: boolean }) =>
      stateDispatch({ type: 'addItem', item, shift: false, items, equip }),
    [items, stateDispatch]
  );

  const handleSyncModsFromEquipped = () => {
    const mods: number[] = [];
    const equippedArmor = store.items.filter(
      (item) => item.equipped && itemCanBeInLoadout(item) && item.bucket.sort === 'Armor'
    );
    for (const item of equippedArmor) {
      mods.push(...extractArmorModHashes(item));
    }
    stateDispatch({ type: 'updateMods', mods });
  };

  // TODO: i18n the category title
  return (
    <div className={styles.contents}>
      <LoadoutEditSection
        title="Subclass"
        onClear={handleClearSubclass}
        onFillFromEquipped={function (): void {
          throw new Error('Function not implemented.');
        }}
      >
        <LoadoutSubclassSection defs={defs} subclass={subclass} power={power} />
      </LoadoutEditSection>
      {['Weapons', 'Armor', 'General'].map((category) => (
        <LoadoutEditSection
          key={category}
          title={category}
          onClear={() => handleClearCategory(category)}
          onFillFromEquipped={() =>
            fillLoadoutFromEquipped(loadout, itemsByBucket, store, updateLoadout, category)
          }
          onFillFromInventory={() => fillLoadoutFromUnequipped(loadout, store, onAddItem, category)}
        >
          <LoadoutEditBucket
            category={category}
            subclass={subclass}
            storeId={store.id}
            items={categories[category]}
            savedMods={savedMods}
            modsByBucket={modsByBucket}
            equippedItemIds={equippedItemIds}
            loadout={loadout}
            onClickPlaceholder={onClickPlaceholder}
            onClickWarnItem={onClickWarnItem}
            onRemoveItem={onRemoveItem}
          />
        </LoadoutEditSection>
      ))}
      <LoadoutEditSection
        title="Mods"
        className={styles.mods}
        onClear={handleClearMods}
        onSyncFromEquipped={handleSyncModsFromEquipped}
      >
        <LoadoutMods
          loadout={loadout}
          storeId={store.id}
          savedMods={savedMods}
          onUpdateMods={handleUpdateMods}
        />
      </LoadoutEditSection>
    </div>
  );
}
