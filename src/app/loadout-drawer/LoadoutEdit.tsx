import { allItemsSelector, bucketsSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import LoadoutItemCategorySection from 'app/loadout/loadout-ui/LoadoutItemCategorySection';
import LoadoutMods from 'app/loadout/loadout-ui/LoadoutMods';
import LoadoutSubclassSection from 'app/loadout/loadout-ui/LoadoutSubclassSection';
import { getItemsAndSubclassFromLoadout } from 'app/loadout/LoadoutView';
import { useD2Definitions } from 'app/manifest/selectors';
import _ from 'lodash';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Loadout } from './loadout-types';
import { getLight, getModsFromLoadout } from './loadout-utils';
import styles from './LoadoutEdit.m.scss';
import LoadoutEditSection from './LoadoutEditSection';

export default function LoadoutEdit({ loadout, store }: { loadout: Loadout; store: DimStore }) {
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
          <LoadoutItemCategorySection
            category={category}
            subclass={subclass}
            storeId={store.id}
            items={categories[category]}
            savedMods={savedMods}
            modsByBucket={modsByBucket}
            equippedItemIds={equippedItemIds}
            loadout={loadout}
          />
        </LoadoutEditSection>
      ))}
      <LoadoutEditSection
        title="Mods"
        className={styles.mods}
        onClear={function (): void {
          throw new Error('Function not implemented.');
        }}
        onAddFromEquipped={function (): void {
          throw new Error('Function not implemented.');
        }}
      >
        <LoadoutMods
          loadout={loadout}
          storeId={store.id}
          savedMods={savedMods}
          onPickMod={() => console.log('pick mod')}
        />
      </LoadoutEditSection>
    </div>
  );
}
