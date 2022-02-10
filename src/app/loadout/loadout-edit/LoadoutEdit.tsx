import { t } from 'app/i18next-t';
import { InventoryBucket } from 'app/inventory/inventory-buckets';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { allItemsSelector, bucketsSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { SocketOverrides } from 'app/inventory/store/override-sockets';
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
  setLoadoutSubclassFromEquipped,
} from 'app/loadout-drawer/LoadoutDrawerContents';
import LoadoutMods from 'app/loadout/loadout-ui/LoadoutMods';
import { getItemsAndSubclassFromLoadout } from 'app/loadout/LoadoutView';
import { useD2Definitions } from 'app/manifest/selectors';
import { itemCanBeInLoadout } from 'app/utils/item-utils';
import { count } from 'app/utils/util';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import produce from 'immer';
import _ from 'lodash';
import React, { useCallback, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { useSelector } from 'react-redux';
import { hasVisibleLoadoutParameters } from '../loadout-ui/LoadoutParametersDisplay';
import SubclassPlugDrawer from '../SubclassPlugDrawer';
import styles from './LoadoutEdit.m.scss';
import LoadoutEditBucket, { ArmorExtras } from './LoadoutEditBucket';
import LoadoutEditSection from './LoadoutEditSection';
import LoadoutEditSubclass from './LoadoutEditSubclass';

export default function LoadoutEdit({
  loadout,
  store,
  stateDispatch,
  onClickSubclass,
  onClickPlaceholder,
  onClickWarnItem,
  onRemoveItem,
}: {
  loadout: Loadout;
  store: DimStore;
  stateDispatch: React.Dispatch<Action>;
  onClickSubclass: (subclass: DimItem | undefined) => void;
  onClickPlaceholder: (params: { bucket: InventoryBucket }) => void;
  onClickWarnItem: (item: DimItem) => void;
  onRemoveItem: (item: DimItem) => void;
}) {
  const defs = useD2Definitions()!;
  const buckets = useSelector(bucketsSelector)!;
  const allItems = useSelector(allItemsSelector);
  const [plugDrawerOpen, setPlugDrawerOpen] = useState(false);

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

  const isEquipped = (i: DimItem) =>
    Boolean(i.owner !== 'unknown' && i.power && equippedItemIds.has(i.id));
  const showPower =
    count(categories.Weapons ?? [], isEquipped) === 3 &&
    count(categories.Armor ?? [], isEquipped) === 5;
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

  const onModsByBucketUpdated = (
    modsByBucket:
      | {
          [bucketHash: number]: number[];
        }
      | undefined
  ) => stateDispatch({ type: 'updateModsByBucket', modsByBucket });

  const handleApplySocketOverrides = useCallback(
    (item: DimItem, socketOverrides: SocketOverrides) => {
      stateDispatch({ type: 'applySocketOverrides', item, socketOverrides });
    },
    [stateDispatch]
  );

  const handleToggleEquipped = (item: DimItem) => {
    stateDispatch({ type: 'equipItem', item, items });
  };

  const handleClearLoadoutParameters = () => {
    const newLoadout = produce(loadout, (draft) => {
      if (draft.parameters) {
        delete draft.parameters.assumeArmorMasterwork;
        delete draft.parameters.exoticArmorHash;
        delete draft.parameters.lockArmorEnergyType;
        delete draft.parameters.query;
        delete draft.parameters.statConstraints;
        delete draft.parameters.upgradeSpendTier;
        delete draft.parameters.autoStatMods;
      }
    });
    updateLoadout(newLoadout);
  };

  const anyClass = loadout.classType === DestinyClass.Unknown;

  // TODO: i18n the category title
  // TODO: dedupe styles/code
  return (
    <div className={styles.contents}>
      {!anyClass && (
        <LoadoutEditSection
          title={t('Bucket.Class')}
          onClear={handleClearSubclass}
          onFillFromEquipped={() =>
            setLoadoutSubclassFromEquipped(loadout, subclass, store, updateLoadout)
          }
        >
          <LoadoutEditSubclass
            defs={defs}
            subclass={subclass}
            power={power}
            onRemove={handleClearSubclass}
            onPick={() => onClickSubclass(subclass)}
          />
          {subclass && (
            <div className={styles.buttons}>
              {subclass.sockets ? (
                <button
                  type="button"
                  className="dim-button"
                  onClick={() => setPlugDrawerOpen(true)}
                >
                  {t('LB.SelectSubclassOptions')}
                </button>
              ) : (
                <div>{t('Loadouts.CannotCustomizeSubclass')}</div>
              )}
            </div>
          )}
          {plugDrawerOpen &&
            subclass &&
            ReactDOM.createPortal(
              <SubclassPlugDrawer
                subclass={subclass}
                socketOverrides={subclass.socketOverrides ?? {}}
                onClose={() => setPlugDrawerOpen(false)}
                onAccept={(overrides) => handleApplySocketOverrides(subclass, overrides)}
              />,
              document.body
            )}
        </LoadoutEditSection>
      )}
      {(anyClass ? ['Weapons', 'General'] : ['Weapons', 'Armor', 'General']).map((category) => (
        <LoadoutEditSection
          key={category}
          title={t(`Bucket.${category}`, { contextList: 'buckets' })}
          onClear={() => handleClearCategory(category)}
          onFillFromEquipped={() =>
            fillLoadoutFromEquipped(loadout, itemsByBucket, store, updateLoadout, category)
          }
          onFillFromInventory={() => fillLoadoutFromUnequipped(loadout, store, onAddItem, category)}
          onClearLoadutParameters={
            category === 'Armor' && hasVisibleLoadoutParameters(loadout.parameters)
              ? handleClearLoadoutParameters
              : undefined
          }
        >
          <LoadoutEditBucket
            category={category}
            storeId={store.id}
            items={categories[category]}
            modsByBucket={modsByBucket}
            equippedItemIds={equippedItemIds}
            onClickPlaceholder={onClickPlaceholder}
            onClickWarnItem={onClickWarnItem}
            onRemoveItem={onRemoveItem}
            onToggleEquipped={handleToggleEquipped}
          >
            {category === 'Armor' && (
              <ArmorExtras
                loadout={loadout}
                storeId={store.id}
                subclass={subclass}
                items={categories[category]}
                savedMods={savedMods}
                equippedItemIds={equippedItemIds}
                onModsByBucketUpdated={onModsByBucketUpdated}
              />
            )}
          </LoadoutEditBucket>
        </LoadoutEditSection>
      ))}
      <LoadoutEditSection
        title={t('Loadouts.Mods')}
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
