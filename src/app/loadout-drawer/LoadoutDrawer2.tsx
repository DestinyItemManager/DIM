import { t } from 'app/i18next-t';
import { getStore } from 'app/inventory/stores-helpers';
import LoadoutView from 'app/loadout/LoadoutView';
import { useDefinitions } from 'app/manifest/selectors';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { useEventBusListener } from 'app/utils/hooks';
import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import { v4 as uuidv4 } from 'uuid';
import Sheet from '../dim-ui/Sheet';
import { DimItem } from '../inventory/item-types';
import { allItemsSelector, bucketsSelector, storesSelector } from '../inventory/selectors';
import '../inventory/Stores.scss';
import { deleteLoadout, updateLoadout } from './actions';
import { stateReducer } from './loadout-drawer-reducer';
import './loadout-drawer.scss';
import { addItem$, editLoadout$ } from './loadout-events';
import { getItemsFromLoadoutItems } from './loadout-item-conversion';
import LoadoutDrawerHeader from './LoadoutDrawerHeader';

// TODO: Consider moving editLoadout/addItemToLoadout/loadoutDialogOpen into Redux (actions + state)
// TODO: break out a container from the actual loadout drawer so we can lazy load the drawer

/** Is the loadout drawer currently open? */
export let loadoutDialogOpen = false;

/**
 * The Loadout editor that shows up as a sheet on the Inventory screen. You can build and edit
 * loadouts from this interface.
 */
export default function LoadoutDrawer2() {
  const dispatch = useThunkDispatch();
  const defs = useDefinitions()!;

  const stores = useSelector(storesSelector);
  const allItems = useSelector(allItemsSelector);
  const buckets = useSelector(bucketsSelector)!;
  const [showingItemPicker, setShowingItemPicker] = useState(false);

  // All state and the state of the loadout is managed through this reducer
  const [{ loadout, storeId, isNew }, stateDispatch] = useReducer(stateReducer, {
    showClass: true,
    isNew: false,
    modPicker: {
      show: false,
    },
    showFashionDrawer: false,
  });

  // TODO: move to a container?
  // Sync this global variable with our actual state. TODO: move to redux
  loadoutDialogOpen = Boolean(loadout);

  // The loadout to edit comes in from the editLoadout$ observable
  useEventBusListener(
    editLoadout$,
    useCallback(({ loadout, storeId, showClass, isNew }) => {
      stateDispatch({
        type: 'editLoadout',
        loadout,
        storeId,
        showClass: Boolean(showClass),
        isNew: Boolean(isNew),
      });
    }, [])
  );

  const loadoutItems = loadout?.items;

  const store = storeId
    ? getStore(stores, storeId)
    : stores.find((s) => !s.isVault && s.classType === loadout?.classType);

  // Turn loadout items into real DimItems
  const [items] = useMemo(
    () => getItemsFromLoadoutItems(loadoutItems, defs, buckets, allItems),
    [defs, buckets, loadoutItems, allItems]
  );

  const onAddItem = useCallback(
    (item: DimItem, e?: MouseEvent | React.MouseEvent, equip?: boolean) =>
      stateDispatch({ type: 'addItem', item, shift: Boolean(e?.shiftKey), items, equip }),
    [items]
  );

  /**
   * If an item comes in on the addItem$ observable, add it.
   */
  useEventBusListener(
    addItem$,
    useCallback(({ item, clickEvent }) => onAddItem(item, clickEvent), [onAddItem])
  );

  const close = () => {
    stateDispatch({ type: 'reset' });
    setShowingItemPicker(false);
  };

  // Close the sheet on navigation
  const { pathname } = useLocation();
  useEffect(close, [pathname]);

  const handleSaveLoadout = (e: React.MouseEvent, saveAsNew?: boolean) => {
    e.preventDefault();
    if (!loadout) {
      return;
    }

    let loadoutToSave = loadout;

    if (saveAsNew) {
      loadoutToSave = {
        ...loadout,
        id: uuidv4(), // Let it be a new ID
      };
    }

    if (loadoutToSave.name === t('Loadouts.FromEquipped')) {
      loadoutToSave = {
        ...loadoutToSave,
        name: `${loadoutToSave.name} ${new Date().toLocaleString()}`,
      };
    }

    dispatch(updateLoadout(loadoutToSave));
    close();
  };

  if (!loadout || !store) {
    return null;
  }

  const handleDeleteLoadout = () => {
    dispatch(deleteLoadout(loadout.id));
    close();
  };

  const handleNotesChanged: React.ChangeEventHandler<HTMLTextAreaElement> = (e) =>
    stateDispatch({ type: 'update', loadout: { ...loadout, notes: e.target.value } });

  const header = (
    <LoadoutDrawerHeader
      loadout={loadout}
      store={store}
      isNew={isNew}
      onUpdateLoadout={(loadout) => stateDispatch({ type: 'update', loadout })}
      onNotesChanged={handleNotesChanged}
      onSaveLoadout={handleSaveLoadout}
      onDeleteLoadout={handleDeleteLoadout}
    />
  );

  // TODO: Bring back the drag zone
  // TODO: minimize for better dragging/picking?
  // TODO: actually make this editable
  // TODO: how to choose equipped/unequipped
  // TODO: contextual buttons!
  // TODO: borders?

  return (
    <Sheet onClose={close} header={header} disabled={showingItemPicker}>
      <LoadoutView store={store} loadout={loadout} actionButtons={[]} />
    </Sheet>
  );
}
