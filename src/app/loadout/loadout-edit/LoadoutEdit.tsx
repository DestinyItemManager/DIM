import { t } from 'app/i18next-t';
import { D2BucketCategory, InventoryBucket } from 'app/inventory/inventory-buckets';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { allItemsSelector, bucketsSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { SocketOverrides } from 'app/inventory/store/override-sockets';
import { Action } from 'app/loadout-drawer/loadout-drawer-reducer';
import { Loadout, ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import { getModsFromLoadout, getUnequippedItemsForLoadout } from 'app/loadout-drawer/loadout-utils';
import LoadoutMods from 'app/loadout/loadout-ui/LoadoutMods';
import { getItemsAndSubclassFromLoadout, loadoutPower } from 'app/loadout/LoadoutView';
import { useD2Definitions } from 'app/manifest/selectors';
import { emptyObject } from 'app/utils/empty';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import React, { useCallback, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { useSelector } from 'react-redux';
import { hasVisibleLoadoutParameters } from '../loadout-ui/LoadoutParametersDisplay';
import SubclassPlugDrawer from '../SubclassPlugDrawer';
import styles from './LoadoutEdit.m.scss';
import LoadoutEditBucket, { ArmorExtras } from './LoadoutEditBucket';
import LoadoutEditBucketDropTarget from './LoadoutEditBucketDropTarget';
import LoadoutEditSection from './LoadoutEditSection';
import LoadoutEditSubclass from './LoadoutEditSubclass';

export default function LoadoutEdit({
  loadout,
  store,
  stateDispatch,
  onClickSubclass,
  onClickPlaceholder,
  onClickWarnItem,
}: {
  loadout: Loadout;
  store: DimStore;
  stateDispatch: React.Dispatch<Action>;
  onClickSubclass: (subclass: DimItem | undefined) => void;
  onClickPlaceholder: (params: { bucket: InventoryBucket; equip: boolean }) => void;
  onClickWarnItem: (resolvedItem: ResolvedLoadoutItem) => void;
}) {
  const defs = useD2Definitions()!;
  const buckets = useSelector(bucketsSelector)!;
  const allItems = useSelector(allItemsSelector);
  const [plugDrawerOpen, setPlugDrawerOpen] = useState(false);

  // TODO: filter down by usable mods?
  const modsByBucket: {
    [bucketHash: number]: number[] | undefined;
  } = loadout.parameters?.modsByBucket ?? emptyObject();

  // Turn loadout items into real DimItems, filtering out unequippable items
  const [items, subclass, warnitems] = useMemo(
    () =>
      getItemsAndSubclassFromLoadout(loadout.items, store, defs, buckets, allItems, modsByBucket),
    [loadout.items, defs, buckets, allItems, store, modsByBucket]
  );

  const savedMods = useMemo(() => getModsFromLoadout(defs, loadout), [defs, loadout]);
  const clearUnsetMods = loadout.parameters?.clearMods;
  const categories = _.groupBy(items.concat(warnitems), (li) => li.item.bucket.sort);
  const power = loadoutPower(store, categories);
  const anyClass = loadout.classType === DestinyClass.Unknown;

  /** Updates the loadout replacing it's current mods with all the mods in newMods. */
  const handleUpdateMods = (newMods: PluggableInventoryItemDefinition[]) =>
    stateDispatch({ type: 'updateMods', mods: newMods.map((mod) => mod.hash) });
  const handleClearCategory = (category: string) =>
    stateDispatch({
      type: 'clearCategory',
      category,
    });
  const onModsByBucketUpdated = (
    modsByBucket:
      | {
          [bucketHash: number]: number[];
        }
      | undefined
  ) => stateDispatch({ type: 'updateModsByBucket', modsByBucket });
  const handleApplySocketOverrides = useCallback(
    (resolvedItem: ResolvedLoadoutItem, socketOverrides: SocketOverrides) => {
      stateDispatch({ type: 'applySocketOverrides', resolvedItem, socketOverrides });
    },
    [stateDispatch]
  );
  const handleToggleEquipped = (resolvedItem: ResolvedLoadoutItem) =>
    stateDispatch({ type: 'equipItem', resolvedItem });
  const handleClearUnsetModsChanged = (enabled: boolean) =>
    stateDispatch({ type: 'changeClearMods', enabled });
  const handleClearLoadoutParameters = () => stateDispatch({ type: 'clearLoadoutParameters' });
  const handleFillSubclassFromEquipped = () =>
    stateDispatch({ type: 'setLoadoutSubclassFromEquipped', store });
  const handleFillCategoryFromUnequipped = (category: string) =>
    stateDispatch({ type: 'fillLoadoutFromUnequipped', store, category });
  const handleFillCategoryFromEquipped = (category: string) =>
    stateDispatch({ type: 'fillLoadoutFromEquipped', store, category });
  const handleClearMods = () => stateDispatch({ type: 'clearMods' });
  const onRemoveItem = (resolvedItem: ResolvedLoadoutItem) =>
    stateDispatch({ type: 'removeItem', resolvedItem });
  const handleClearSubclass = () => stateDispatch({ type: 'clearSubclass' });
  const handleSyncModsFromEquipped = () => stateDispatch({ type: 'syncModsFromEquipped', store });

  // TODO: dedupe styles/code
  return (
    <div className={styles.contents}>
      {!anyClass && (
        <LoadoutEditSection
          title={t('Bucket.Class')}
          onClear={handleClearSubclass}
          onFillFromEquipped={handleFillSubclassFromEquipped}
        >
          <LoadoutEditBucketDropTarget
            category="Subclass"
            classType={loadout.classType}
            equippedOnly={true}
          >
            <LoadoutEditSubclass
              defs={defs}
              subclass={subclass}
              power={power}
              onRemove={handleClearSubclass}
              onPick={() => onClickSubclass(subclass?.item)}
            />
            {subclass && (
              <div className={styles.buttons}>
                {subclass.item.sockets ? (
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
                  subclass={subclass.item}
                  socketOverrides={subclass.loadoutItem.socketOverrides ?? {}}
                  onClose={() => setPlugDrawerOpen(false)}
                  onAccept={(overrides) => handleApplySocketOverrides(subclass, overrides)}
                />,
                document.body
              )}
          </LoadoutEditBucketDropTarget>
        </LoadoutEditSection>
      )}
      {(anyClass ? ['Weapons', 'General'] : ['Weapons', 'Armor', 'General']).map(
        (category: D2BucketCategory) => (
          <LoadoutEditSection
            key={category}
            title={t(`Bucket.${category}`, { contextList: 'buckets' })}
            onClear={() => handleClearCategory(category)}
            onFillFromEquipped={() => handleFillCategoryFromEquipped(category)}
            fillFromInventoryCount={getUnequippedItemsForLoadout(store, category).length}
            onFillFromInventory={() => handleFillCategoryFromUnequipped(category)}
            onClearLoadoutParameters={
              category === 'Armor' && hasVisibleLoadoutParameters(loadout.parameters)
                ? handleClearLoadoutParameters
                : undefined
            }
          >
            <LoadoutEditBucketDropTarget category={category} classType={loadout.classType}>
              <LoadoutEditBucket
                category={category}
                storeId={store.id}
                items={categories[category]}
                modsByBucket={modsByBucket}
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
                    onModsByBucketUpdated={onModsByBucketUpdated}
                  />
                )}
              </LoadoutEditBucket>
            </LoadoutEditBucketDropTarget>
          </LoadoutEditSection>
        )
      )}
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
          clearUnsetMods={clearUnsetMods}
          onClearUnsetModsChanged={handleClearUnsetModsChanged}
        />
      </LoadoutEditSection>
    </div>
  );
}
