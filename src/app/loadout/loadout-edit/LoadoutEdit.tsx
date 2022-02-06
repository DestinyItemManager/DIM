import { InventoryBucket } from 'app/inventory/inventory-buckets';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { allItemsSelector, bucketsSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { Action } from 'app/loadout-drawer/loadout-drawer-reducer';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { getLight, getModsFromLoadout } from 'app/loadout-drawer/loadout-utils';
import LoadoutMods from 'app/loadout/loadout-ui/LoadoutMods';
import LoadoutSubclassSection from 'app/loadout/loadout-ui/LoadoutSubclassSection';
import { getItemsAndSubclassFromLoadout } from 'app/loadout/LoadoutView';
import { useD2Definitions } from 'app/manifest/selectors';
import _ from 'lodash';
import React, { useMemo } from 'react';
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

  // TODO: i18n the category title
  return (
    <div className={styles.contents}>
      <LoadoutEditSection
        title="Subclass"
        onClear={function (): void {
          throw new Error('Function not implemented.');
        }}
        onAddFromEquipped={function (): void {
          throw new Error('Function not implemented.');
        }}
      >
        <LoadoutSubclassSection defs={defs} subclass={subclass} power={power} />
      </LoadoutEditSection>
      {['Weapons', 'Armor', 'General'].map((category) => (
        <LoadoutEditSection
          key={category}
          title={category}
          onClear={function (): void {
            throw new Error('Function not implemented.');
          }}
          onAddFromEquipped={function (): void {
            throw new Error('Function not implemented.');
          }}
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
        onAddFromEquipped={function (): void {
          throw new Error('Function not implemented.');
        }}
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
