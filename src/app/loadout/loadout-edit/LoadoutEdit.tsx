import { t } from 'app/i18next-t';
import { D2BucketCategory, InventoryBucket } from 'app/inventory/inventory-buckets';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { allItemsSelector, bucketsSelector } from 'app/inventory/selectors';
import { DimStore } from 'app/inventory/store-types';
import { SocketOverrides } from 'app/inventory/store/override-sockets';
import { Action } from 'app/loadout-drawer/loadout-drawer-reducer';
import { Loadout, LoadoutItem, ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import {
  createSocketOverridesFromEquipped,
  extractArmorModHashes,
  fromEquippedTypes,
  getModsFromLoadout,
} from 'app/loadout-drawer/loadout-utils';
import LoadoutMods from 'app/loadout/loadout-ui/LoadoutMods';
import { getItemsAndSubclassFromLoadout, loadoutPower } from 'app/loadout/LoadoutView';
import { useD2Definitions } from 'app/manifest/selectors';
import { emptyObject } from 'app/utils/empty';
import { itemCanBeInLoadout } from 'app/utils/item-utils';
import { infoLog } from 'app/utils/log';
import { getSocketsByCategoryHash } from 'app/utils/socket-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { BucketHashes, SocketCategoryHashes } from 'data/d2/generated-enums';
import produce from 'immer';
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

  /** Updates the loadout replacing it's current mods with all the mods in newMods. */
  const handleUpdateModHashes = (mods: number[]) => stateDispatch({ type: 'updateMods', mods });
  const handleUpdateMods = (newMods: PluggableInventoryItemDefinition[]) =>
    handleUpdateModHashes(newMods.map((mod) => mod.hash));
  const handleClearMods = () => handleUpdateMods([]);

  const handleClearCategory = (category: string) => {
    // TODO: do these all in one action
    for (const li of items.concat(warnitems)) {
      if (li.item.bucket.sort === category && li.item.bucket.hash !== BucketHashes.Subclass) {
        stateDispatch({ type: 'removeItem', resolvedItem: li });
      }
    }
  };

  const onRemoveItem = (resolvedItem: ResolvedLoadoutItem) =>
    stateDispatch({ type: 'removeItem', resolvedItem });

  const handleClearSubclass = () => subclass && onRemoveItem(subclass);

  const updateLoadout = (loadout: Loadout) => stateDispatch({ type: 'update', loadout });

  const onAddItem = (item: DimItem, equip?: boolean) =>
    stateDispatch({ type: 'addItem', item, equip });

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
    (resolvedItem: ResolvedLoadoutItem, socketOverrides: SocketOverrides) => {
      stateDispatch({ type: 'applySocketOverrides', resolvedItem, socketOverrides });
    },
    [stateDispatch]
  );

  const handleToggleEquipped = (resolvedItem: ResolvedLoadoutItem) => {
    stateDispatch({ type: 'equipItem', resolvedItem });
  };

  const handleClearUnsetModsChanged = (enabled: boolean) => {
    stateDispatch({ type: 'changeClearMods', enabled });
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
            setLoadoutSubclassFromEquipped(loadout, subclass?.item, store, updateLoadout)
          }
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
            onFillFromEquipped={() =>
              fillLoadoutFromEquipped(
                loadout,
                items.map((li) => li.item),
                store,
                updateLoadout,
                category
              )
            }
            fillFromInventoryCount={getUnequippedItemsForLoadout(store, category).length}
            onFillFromInventory={() =>
              fillLoadoutFromUnequipped(loadout, store, onAddItem, category)
            }
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

/** Replace the loadout's subclass with the currently equipped subclass */
function setLoadoutSubclassFromEquipped(
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

// TODO: push into reducer
export function fillLoadoutFromEquipped(
  loadout: Loadout,
  // TODO: knock this out?
  items: DimItem[],
  dimStore: DimStore,
  onUpdateLoadout: (loadout: Loadout) => void,
  // This is a bit dangerous as it is only used from the new loadout edit drawer and
  // has special handling that would break the old loadout drawer
  category?: string
) {
  if (!loadout) {
    return;
  }

  const itemsByBucket = _.groupBy(items, (li) => li.bucket.hash);

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

// TODO: push into reducer?
export async function fillLoadoutFromUnequipped(
  loadout: Loadout,
  dimStore: DimStore,
  add: (item: DimItem, equip?: boolean) => void,
  category?: string
) {
  if (!loadout) {
    return;
  }

  const items = getUnequippedItemsForLoadout(dimStore, category);
  for (const item of items) {
    add(item, false);
  }
}

/**
 * filter for items that are in a character's "pockets" but not equipped,
 * and can be added to a loadout
 */
function getUnequippedItemsForLoadout(dimStore: DimStore, category?: string) {
  return dimStore.items.filter(
    (item) =>
      !item.location.inPostmaster &&
      item.bucket.hash !== BucketHashes.Subclass &&
      itemCanBeInLoadout(item) &&
      (category ? item.bucket.sort === category : fromEquippedTypes.includes(item.bucket.hash)) &&
      !item.equipped
  );
}
