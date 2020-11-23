import { destinyVersionSelector } from 'app/accounts/selectors';
import { t } from 'app/i18next-t';
import ModPicker from 'app/loadout-builder/filter/ModPicker';
import { LockedArmor2ModMap } from 'app/loadout-builder/types';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { useSubscription } from 'app/utils/hooks';
import { itemCanBeInLoadout } from 'app/utils/item-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import copy from 'fast-copy';
import produce from 'immer';
import _ from 'lodash';
import React, { useEffect, useMemo, useReducer } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { useLocation } from 'react-router';
import { createSelector } from 'reselect';
import { Subject } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { D1ManifestDefinitions } from '../destiny1/d1-definitions';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import Sheet from '../dim-ui/Sheet';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import InventoryItem from '../inventory/InventoryItem';
import { DimItem } from '../inventory/item-types';
import { allItemsSelector, bucketsSelector, storesSelector } from '../inventory/selectors';
import { DimStore } from '../inventory/store-types';
import { showItemPicker } from '../item-picker/item-picker';
import { showNotification } from '../notifications/notifications';
import { itemSortOrderSelector } from '../settings/item-sort';
import { deleteLoadout, updateLoadout } from './actions';
import { GeneratedLoadoutStats } from './GeneratedLoadoutStats';
import './loadout-drawer.scss';
import { Loadout, LoadoutItem } from './loadout-types';
import { getItemsFromLoadoutItems, newLoadout } from './loadout-utils';
import LoadoutDrawerContents from './LoadoutDrawerContents';
import LoadoutDrawerDropTarget from './LoadoutDrawerDropTarget';
import LoadoutDrawerOptions from './LoadoutDrawerOptions';
import { getLockedModMapFromModHashes } from './mod-utils';
import { loadoutsSelector } from './selectors';

// TODO: Consider moving editLoadout/addItemToLoadout/loadoutDialogOpen into Redux (actions + state)

/** Is the loadout drawer currently open? */
export let loadoutDialogOpen = false;

export const editLoadout$ = new Subject<{
  loadout: Loadout;
  showClass?: boolean;
  isNew?: boolean;
}>();
export const addItem$ = new Subject<{
  item: DimItem;
  clickEvent: MouseEvent;
}>();

/**
 * Start editing a loadout.
 */
export function editLoadout(loadout: Loadout, { showClass = true, isNew = true } = {}) {
  editLoadout$.next({
    loadout,
    showClass,
    isNew,
  });
}

/**
 * Add an item to the loadout we're currently editing. This is driven by clicks in Inventory.
 */
export function addItemToLoadout(item: DimItem, $event) {
  addItem$.next({
    item,
    clickEvent: $event,
  });
}

interface StoreProps {
  itemSortOrder: string[];
  classTypeOptions: {
    label: string;
    value: number;
  }[];
  stores: DimStore[];
  allItems: DimItem[];
  buckets: InventoryBuckets;
  defs: D1ManifestDefinitions | D2ManifestDefinitions;
  loadouts: Loadout[];
}

type Props = StoreProps & ThunkDispatchProp;

interface State {
  loadout?: Readonly<Loadout>;
  showClass: boolean;
  isNew: boolean;
  modPickerOpen: boolean;
}

type Action =
  /** Reset the tool (for when the sheet is closed) */
  | { type: 'reset' }
  /** Start editing a new or existing loadout */
  | {
      type: 'editLoadout';
      loadout: Loadout;
      isNew: boolean;
      showClass: boolean;
    }
  /** Replace the current loadout with an updated one */
  | { type: 'update'; loadout: Loadout }
  /** Add an item to the loadout */
  | { type: 'addItem'; item: DimItem; shift: boolean; items: DimItem[] }
  /** Remove an item from the loadout */
  | { type: 'removeItem'; item: DimItem; shift: boolean; items: DimItem[] }
  /** Make an item that's already in the loadout equipped */
  | { type: 'equipItem'; item: DimItem; items: DimItem[] }
  | { type: 'openModPicker'; modPickerOpen: boolean };

/**
 * All state for this component is managed through this reducer and the Actions above.
 */
function stateReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'reset':
      return {
        showClass: true,
        isNew: false,
        loadout: undefined,
        modPickerOpen: false,
      };

    case 'editLoadout': {
      const { loadout, isNew, showClass } = action;

      return {
        ...state,
        loadout,
        isNew,
        showClass,
      };
    }

    case 'update':
      return {
        ...state,
        loadout: action.loadout,
      };

    case 'addItem': {
      const { loadout } = state;
      const { item, shift, items } = action;

      if (!itemCanBeInLoadout(item)) {
        showNotification({ type: 'warning', title: t('Loadouts.OnlyItems') });
        return state;
      }

      return {
        ...state,
        loadout: addItem(loadout || newLoadout('', []), item, shift, items),
        isNew: !loadout,
      };
    }

    case 'removeItem': {
      const { loadout } = state;
      const { item, shift, items } = action;
      return loadout
        ? {
            ...state,
            loadout: removeItem(loadout, item, shift, items),
          }
        : state;
    }

    case 'equipItem': {
      const { loadout } = state;
      const { item, items } = action;
      return loadout
        ? {
            ...state,
            loadout: equipItem(loadout, item, items),
          }
        : state;
    }

    case 'openModPicker': {
      const { modPickerOpen } = action;
      return { ...state, modPickerOpen };
    }
  }
}

/**
 * Produce a new loadout that adds a new item to the given loadout.
 */
function addItem(
  loadout: Readonly<Loadout>,
  item: DimItem,
  shift: boolean,
  items: DimItem[]
): Loadout {
  const loadoutItem: LoadoutItem = {
    id: item.id,
    hash: item.hash,
    amount: Math.min(item.amount, shift ? 5 : 1),
    equipped: false,
  };

  // Other items of the same type (as DimItem)
  const typeInventory = items.filter((i) => i.type === item.type);
  const dupe = loadout.items.find((i) => i.hash === item.hash && i.id === item.id);
  const maxSlots = item.bucket.capacity;

  return produce(loadout, (draftLoadout) => {
    const findItem = (item: DimItem) =>
      draftLoadout.items.find((i) => i.id === item.id && i.hash === item.hash)!;

    if (!dupe) {
      if (typeInventory.length < maxSlots) {
        loadoutItem.equipped = item.equipment && typeInventory.length === 0;
        if (loadoutItem.equipped) {
          for (const otherItem of typeInventory) {
            findItem(otherItem).equipped = false;
          }
        }

        // Only allow one subclass to be present per class (to allow for making a loadout that specifies a subclass for each class)
        if (item.type === 'Class') {
          const conflictingItem = items.find(
            (i) => i.type === item.type && i.classType === item.classType
          );
          if (conflictingItem) {
            draftLoadout.items = draftLoadout.items.filter((i) => i.id !== conflictingItem.id);
          }
          loadoutItem.equipped = true;
        }

        draftLoadout.items.push(loadoutItem);
      } else {
        showNotification({
          type: 'warning',
          title: t('Loadouts.MaxSlots', { slots: maxSlots }),
        });
      }
    } else if (item.maxStackSize > 1) {
      const increment = Math.min(dupe.amount + item.amount, item.maxStackSize) - dupe.amount;
      dupe.amount += increment;
      // TODO: handle stack splits
    }

    if (
      draftLoadout.classType === DestinyClass.Unknown &&
      item.classType !== DestinyClass.Unknown
    ) {
      draftLoadout.classType = item.classType;
    }
  });
}

/**
 * Produce a new Loadout with the given item removed from the original loadout.
 */
function removeItem(
  loadout: Readonly<Loadout>,
  item: DimItem,
  shift: boolean,
  items: DimItem[]
): Loadout {
  return produce(loadout, (draftLoadout) => {
    const loadoutItem = draftLoadout.items.find((i) => i.hash === item.hash && i.id === item.id);

    if (!loadoutItem) {
      return;
    }

    const decrement = shift ? 5 : 1;
    loadoutItem.amount ||= 1;
    loadoutItem.amount -= decrement;
    if (loadoutItem.amount <= 0) {
      draftLoadout.items = draftLoadout.items.filter(
        (i) => !(i.hash === item.hash && i.id === item.id)
      );
    }

    if (loadoutItem.equipped) {
      const typeInventory = items.filter((i) => i.type === item.type);
      const nextInLine =
        typeInventory.length > 0 &&
        draftLoadout.items.find(
          (i) => i.id === typeInventory[0].id && i.hash === typeInventory[0].hash
        );
      if (nextInLine) {
        nextInLine.equipped = true;
      }
    }
  });
}

/**
 * Produce a new loadout with the given item switched to being equipped (or unequipped if it's already equipped).
 */
function equipItem(loadout: Readonly<Loadout>, item: DimItem, items: DimItem[]) {
  return produce(loadout, (draftLoadout) => {
    const findItem = (item: DimItem) =>
      draftLoadout.items.find((i) => i.id === item.id && i.hash === item.hash)!;

    // Classes are always equipped
    if (item.type === 'Class') {
      return;
    }

    const loadoutItem = findItem(item);
    if (item.equipment) {
      if (loadoutItem.equipped) {
        // It's equipped, mark it unequipped
        loadoutItem.equipped = false;
      } else {
        // It's unequipped - mark all the other items and conflicting exotics unequipped, then mark this equipped
        items
          .filter(
            (i) =>
              // Others in this slot
              i.type === item.type ||
              // Other exotics
              (item.equippingLabel && i.equippingLabel === item.equippingLabel)
          )
          .map(findItem)
          .forEach((i) => {
            i.equipped = false;
          });

        loadoutItem.equipped = true;
      }
    }
  });
}

function mapStateToProps() {
  const classTypeOptionsSelector = createSelector(storesSelector, (stores) => {
    const classTypeValues: {
      label: string;
      value: DestinyClass;
    }[] = _.uniqBy(
      stores.filter((s) => !s.isVault),
      (store) => store.classType
    ).map((store) => ({ label: store.className, value: store.classType }));
    return [{ label: t('Loadouts.Any'), value: DestinyClass.Unknown }, ...classTypeValues];
  });

  return (state: RootState): StoreProps => ({
    itemSortOrder: itemSortOrderSelector(state),
    classTypeOptions: classTypeOptionsSelector(state),
    stores: storesSelector(state),
    allItems: allItemsSelector(state),
    buckets: bucketsSelector(state)!,
    defs:
      destinyVersionSelector(state) === 2 ? state.manifest.d2Manifest! : state.manifest.d1Manifest!,
    loadouts: loadoutsSelector(state),
  });
}

/**
 * The Loadout editor that shows up as a sheet on the Inventory screen. You can build and edit
 * loadouts from this interface.
 */
function LoadoutDrawer({
  buckets,
  classTypeOptions,
  stores,
  allItems,
  itemSortOrder,
  defs,
  loadouts,
  dispatch,
}: Props) {
  // All state and the state of the loadout is managed through this reducer
  const [{ loadout, showClass, isNew, modPickerOpen }, stateDispatch] = useReducer(stateReducer, {
    showClass: true,
    isNew: false,
    modPickerOpen: false,
  });

  // Sync this global variable with our actual state. TODO: move to redux
  loadoutDialogOpen = Boolean(loadout);

  // The loadout to edit comes in from the editLoadout$ rx observable
  const editLoadout = (args: { loadout: Loadout; showClass?: boolean; isNew?: boolean }) => {
    const loadout = args.loadout;
    const isNew = Boolean(args.isNew);
    const showClass = Boolean(args.showClass);

    stateDispatch({ type: 'editLoadout', loadout, showClass, isNew });
  };
  useSubscription(() => editLoadout$.subscribe(editLoadout));

  const loadoutItems = loadout?.items;

  // Turn loadout items into real DimItems
  const [items, warnitems] = useMemo(() => getItemsFromLoadoutItems(loadoutItems, defs, allItems), [
    defs,
    loadoutItems,
    allItems,
  ]);

  const onAddItem = (item: DimItem, e?: MouseEvent) =>
    stateDispatch({ type: 'addItem', item, shift: Boolean(e?.shiftKey), items });

  const onRemoveItem = (item: DimItem, e?: React.MouseEvent) =>
    stateDispatch({ type: 'removeItem', item, shift: Boolean(e?.shiftKey), items });

  const onEquipItem = (item: DimItem) => stateDispatch({ type: 'equipItem', item, items });

  /**
   * If an item comes in on the addItem$ rx observable, add it.
   */
  useSubscription(() =>
    addItem$.subscribe((args: { item: DimItem; clickEvent: MouseEvent }) =>
      onAddItem(args.item, args.clickEvent)
    )
  );

  const close = () => {
    stateDispatch({ type: 'reset' });
  };

  // Close the sheet on navigation
  const { pathname } = useLocation();
  useEffect(close, [pathname]);

  /** Prompt the user to select a replacement for a missing item. */
  const fixWarnItem = async (warnItem: DimItem) => {
    const loadoutClassType = loadout?.classType;

    try {
      const { item } = await showItemPicker({
        filterItems: (item: DimItem) =>
          item.hash === warnItem.hash &&
          itemCanBeInLoadout(item) &&
          (!loadout ||
            loadout.classType === DestinyClass.Unknown ||
            item.classType === loadoutClassType ||
            item.classType === DestinyClass.Unknown),
        prompt: t('Loadouts.FindAnother', { name: warnItem.name }),

        // don't show information related to selected perks so we don't give the impression
        // that we will update perk selections when applying the loadout
        ignoreSelectedPerks: true,
      });

      onAddItem(item);
      onRemoveItem(warnItem);
    } catch (e) {}
  };

  const onSaveLoadout = (
    e: React.MouseEvent,
    loadoutToSave: Readonly<Loadout> | undefined = loadout
  ) => {
    e.preventDefault();
    if (!loadoutToSave) {
      return;
    }

    dispatch(updateLoadout(loadoutToSave));
    close();
  };

  const saveAsNew = (e) => {
    e.preventDefault();

    if (!loadout) {
      return;
    }
    const newLoadout = {
      ...copy(loadout),
      id: uuidv4(), // Let it be a new ID
    };
    onSaveLoadout(e, newLoadout);
  };

  if (!loadout) {
    return null;
  }

  const onDeleteLoadout = () => {
    if (confirm(t('Loadouts.ConfirmDelete', { name: loadout.name }))) {
      dispatch(deleteLoadout(loadout.id));
    }
    close();
  };

  const onUpdateMods = (newLockedArmor2Mods: LockedArmor2ModMap) => {
    const newLoadout = { ...loadout };
    newLoadout.parameters = {
      ...newLoadout.parameters,
      mods: Object.values(newLockedArmor2Mods)
        .flat()
        .map((mod) => mod.modDef.hash),
    };
    stateDispatch({ type: 'update', loadout: newLoadout });
  };

  const removeModByIndex = (index: number) => {
    const newLoadout = { ...loadout };
    const newMods = Array.from(loadout.parameters?.mods || []);
    newMods.splice(index, 1);
    newLoadout.parameters = {
      ...newLoadout.parameters,
      mods: newMods,
    };
    stateDispatch({ type: 'update', loadout: newLoadout });
  };

  const bucketTypes = Object.keys(buckets.byType);

  // Find a loadout with the same name that could overlap with this one
  // Note that this might be the saved version of this very same loadout!
  const clashingLoadout = loadouts.find(
    (l) =>
      loadout.name === l.name &&
      (loadout.classType === l.classType ||
        l.classType === DestinyClass.Unknown ||
        loadout.classType === DestinyClass.Unknown)
  );

  const header = (
    <div className="loadout-drawer-header">
      <h1>{isNew ? t('Loadouts.Create') : t('Loadouts.Edit')}</h1>
      <LoadoutDrawerOptions
        loadout={loadout}
        showClass={showClass}
        isNew={isNew}
        classTypeOptions={classTypeOptions}
        updateLoadout={(loadout) => stateDispatch({ type: 'update', loadout })}
        saveLoadout={onSaveLoadout}
        saveAsNew={saveAsNew}
        clashingLoadout={clashingLoadout}
        deleteLoadout={onDeleteLoadout}
      />
      <GeneratedLoadoutStats
        defs={defs}
        stores={stores}
        buckets={buckets}
        items={items}
        loadout={loadout}
        allItems={allItems}
      />
    </div>
  );

  return (
    <>
      <Sheet onClose={close} header={header}>
        <div id="loadout-drawer" className="loadout-create">
          <div className="loadout-content">
            <LoadoutDrawerDropTarget
              bucketTypes={bucketTypes}
              storeIds={stores.map((s) => s.id)}
              onDroppedItem={onAddItem}
            >
              {warnitems.length > 0 && (
                <div className="loadout-contents">
                  <p>{t('Loadouts.VendorsCannotEquip')}</p>
                  <div className="loadout-warn-items">
                    {warnitems.map((item) => (
                      <div key={item.id} className="loadout-item">
                        <InventoryItem item={item} onClick={() => fixWarnItem(item)} />
                        <div className="close" onClick={() => onRemoveItem(item)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="loadout-contents">
                <LoadoutDrawerContents
                  loadout={loadout}
                  items={items}
                  defs={defs}
                  buckets={buckets}
                  stores={stores}
                  itemSortOrder={itemSortOrder}
                  equip={onEquipItem}
                  remove={onRemoveItem}
                  add={onAddItem}
                  onOpenModPicker={() =>
                    stateDispatch({ type: 'openModPicker', modPickerOpen: true })
                  }
                  removeModByIndex={removeModByIndex}
                />
              </div>
            </LoadoutDrawerDropTarget>
          </div>
        </div>
      </Sheet>
      {modPickerOpen &&
        defs.isDestiny2() &&
        ReactDOM.createPortal(
          <ModPicker
            classType={loadout.classType}
            lockedArmor2Mods={getLockedModMapFromModHashes(defs, loadout.parameters?.mods)}
            onAccept={onUpdateMods}
            onClose={() => stateDispatch({ type: 'openModPicker', modPickerOpen: false })}
          />,
          document.body
        )}
    </>
  );
}

export default connect(mapStateToProps)(LoadoutDrawer);
