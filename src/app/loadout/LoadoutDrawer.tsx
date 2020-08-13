import { t } from 'app/i18next-t';
import React, { useEffect, useReducer, useMemo } from 'react';
import InventoryItem from '../inventory/InventoryItem';
import _ from 'lodash';
import copy from 'fast-copy';
import { D1ManifestDefinitions } from '../destiny1/d1-definitions';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { DimItem } from '../inventory/item-types';
import { v4 as uuidv4 } from 'uuid';
import { RootState, ThunkDispatchProp } from 'app/store/types';
import { itemSortOrderSelector } from '../settings/item-sort';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { destinyVersionSelector, currentAccountSelector } from 'app/accounts/selectors';
import { storesSelector, bucketsSelector } from '../inventory/selectors';
import LoadoutDrawerDropTarget from './LoadoutDrawerDropTarget';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import './loadout-drawer.scss';
import { DestinyAccount } from '../accounts/destiny-account';
import Sheet from '../dim-ui/Sheet';
import { showNotification } from '../notifications/notifications';
import { showItemPicker } from '../item-picker/item-picker';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { DimStore } from '../inventory/store-types';
import LoadoutDrawerContents from './LoadoutDrawerContents';
import LoadoutDrawerOptions from './LoadoutDrawerOptions';
import { Subject } from 'rxjs';
import { Loadout, LoadoutItem } from './loadout-types';
import produce from 'immer';
import { useSubscription } from 'app/utils/hooks';
import { useLocation } from 'react-router';
import { emptyArray } from 'app/utils/empty';
import { loadoutsSelector } from './reducer';
import { updateLoadout } from './actions';

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
  account: DestinyAccount;
  classTypeOptions: {
    label: string;
    value: number;
  }[];
  stores: DimStore[];
  buckets: InventoryBuckets;
  defs: D1ManifestDefinitions | D2ManifestDefinitions;
  loadouts: Loadout[];
}

type Props = StoreProps & ThunkDispatchProp;

interface State {
  loadout?: Readonly<Loadout>;
  show: boolean;
  showClass: boolean;
  isNew: boolean;
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
      account: DestinyAccount;
    }
  /** Replace the current loadout with an updated one */
  | { type: 'update'; loadout: Loadout }
  /** Add an item to the loadout */
  | { type: 'addItem'; item: DimItem; equip?: boolean; shift: boolean; items: DimItem[] }
  /** Remove an item from the loadout */
  | { type: 'removeItem'; item: DimItem; shift: boolean; items: DimItem[] }
  /** Make an item that's already in the loadout equipped */
  | { type: 'equipItem'; item: DimItem; items: DimItem[] };

/**
 * All state for this component is managed through this reducer and the Actions above.
 */
function stateReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'reset':
      return {
        show: false,
        showClass: true,
        isNew: false,
        loadout: undefined,
      };

    case 'editLoadout': {
      const { loadout, isNew, showClass, account } = action;

      return {
        ...state,
        loadout: {
          ...loadout,
          destinyVersion: account.destinyVersion,
          membershipId: account.membershipId,
        },
        isNew,
        showClass,
        show: true,
      };
    }

    case 'update':
      return {
        ...state,
        loadout: action.loadout,
      };

    case 'addItem': {
      const { loadout } = state;
      const { item, equip, shift, items } = action;

      if (!item.canBeInLoadout()) {
        showNotification({ type: 'warning', title: t('Loadouts.OnlyItems') });
        return state;
      }

      return loadout
        ? {
            ...state,
            loadout: addItem(loadout, item, equip, shift, items),
          }
        : state;
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
  }
}

/**
 * Produce a new loadout that adds a new item to the given loadout.
 */
function addItem(
  loadout: Readonly<Loadout>,
  item: DimItem,
  /** Whether the item should be equipped in the loadout or not. Leave undefined for a sensible default. */
  equip: boolean | undefined,
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
        loadoutItem.equipped =
          equip === undefined ? item.equipment && typeInventory.length === 0 : equip;
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
      dupe.amount = dupe.amount + increment;
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
    loadoutItem.amount = (loadoutItem.amount || 1) - decrement;
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

/**
 * Turn the loadout's items into real DIM items. Any that don't exist in inventory anymore
 * are returned as warnitems.
 */
function findItems(
  loadoutItems: LoadoutItem[] | undefined,
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  stores: DimStore[]
): [DimItem[], DimItem[]] {
  if (!loadoutItems) {
    return [emptyArray(), emptyArray()];
  }

  const findItem = (loadoutItem: LoadoutItem) => {
    for (const store of stores) {
      for (const item of store.items) {
        if (loadoutItem.id && loadoutItem.id !== '0' && loadoutItem.id === item.id) {
          return item;
        } else if ((!loadoutItem.id || loadoutItem.id === '0') && loadoutItem.hash === item.hash) {
          return item;
        }
      }
    }
    return undefined;
  };

  const items: DimItem[] = [];
  const warnitems: DimItem[] = [];
  for (const loadoutItem of loadoutItems) {
    const item = findItem(loadoutItem);
    if (item) {
      items.push(item);
    } else {
      const itemDef = defs.InventoryItem.get(loadoutItem.hash);
      if (itemDef) {
        // TODO: makeFakeItem
        warnitems.push({
          ...loadoutItem,
          icon: itemDef.displayProperties?.icon || itemDef.icon,
          name: itemDef.displayProperties?.name || itemDef.itemName,
        } as DimItem);
      }
    }
  }

  return [items, warnitems];
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
    account: currentAccountSelector(state)!,
    classTypeOptions: classTypeOptionsSelector(state),
    stores: storesSelector(state),
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
  account,
  buckets,
  classTypeOptions,
  stores,
  itemSortOrder,
  defs,
  loadouts,
  dispatch,
}: Props) {
  // All state and the state of the loadout is managed through this reducer
  const [{ show, loadout, showClass, isNew }, stateDispatch] = useReducer(stateReducer, {
    show: false,
    showClass: true,
    isNew: false,
  });

  // The loadout to edit comes in from the editLoadout$ rx observable
  const editLoadout = (args: { loadout: Loadout; showClass?: boolean; isNew?: boolean }) => {
    const loadout = args.loadout;
    const isNew = Boolean(args.isNew);
    const showClass = Boolean(args.showClass);
    loadoutDialogOpen = true;

    stateDispatch({ type: 'editLoadout', loadout, showClass, isNew, account });
  };
  useSubscription(() => editLoadout$.subscribe(editLoadout));

  // Turn loadout items into real DimItems
  const [items, warnitems] = useMemo(() => findItems(loadout?.items, defs, stores), [
    defs,
    loadout?.items,
    stores,
  ]);

  const onAddItem = (item: DimItem, e?: MouseEvent, equip?: boolean) =>
    stateDispatch({ type: 'addItem', item, shift: Boolean(e?.shiftKey), equip, items });

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
    loadoutDialogOpen = false;
  };

  // Close the sheet on navigation
  const { pathname } = useLocation();
  useEffect(close, [pathname]);

  /** Prompt the user to select a replacement for a missing item. */
  const fixWarnItem = async (warnItem: DimItem) => {
    const loadoutClassType = loadout?.classType;

    try {
      const { item, equip } = await showItemPicker({
        filterItems: (item: DimItem) =>
          item.hash === warnItem.hash &&
          item.canBeInLoadout() &&
          (!loadout ||
            loadout.classType === DestinyClass.Unknown ||
            item.classType === loadoutClassType ||
            item.classType === DestinyClass.Unknown),
        prompt: t('Loadouts.FindAnother', { name: warnItem.name }),
        equip: warnItem.equipped,

        // don't show information related to selected perks so we don't give the impression
        // that we will update perk selections when applying the loadout
        ignoreSelectedPerks: true,
      });

      onAddItem(item, undefined, equip);
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

  if (!loadout || !show) {
    return null;
  }

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
      />
    </div>
  );

  return (
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
                buckets={buckets}
                stores={stores}
                itemSortOrder={itemSortOrder}
                equip={onEquipItem}
                remove={onRemoveItem}
                add={onAddItem}
              />
            </div>
          </LoadoutDrawerDropTarget>
        </div>
      </div>
    </Sheet>
  );
}

export default connect(mapStateToProps)(LoadoutDrawer);
