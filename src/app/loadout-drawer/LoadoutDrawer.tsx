import ClosableContainer from 'app/dim-ui/ClosableContainer';
import { t } from 'app/i18next-t';
import { SocketOverrides } from 'app/inventory/store/override-sockets';
import ModPicker from 'app/loadout/ModPicker';
import { useDefinitions } from 'app/manifest/selectors';
import { AppIcon, faExclamationTriangle } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { useEventBusListener } from 'app/utils/hooks';
import { itemCanBeInLoadout } from 'app/utils/item-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import React, { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import { v4 as uuidv4 } from 'uuid';
import Sheet from '../dim-ui/Sheet';
import InventoryItem from '../inventory/InventoryItem';
import { DimItem, PluggableInventoryItemDefinition } from '../inventory/item-types';
import { allItemsSelector, bucketsSelector, storesSelector } from '../inventory/selectors';
import '../inventory/Stores.scss';
import { showItemPicker } from '../item-picker/item-picker';
import { deleteLoadout, updateLoadout } from './actions';
import { GeneratedLoadoutStats } from './GeneratedLoadoutStats';
import { stateReducer } from './loadout-drawer-reducer';
import './loadout-drawer.scss';
import { addItem$, editLoadout$ } from './loadout-events';
import { Loadout } from './loadout-types';
import { getItemsFromLoadoutItems, getModsFromLoadout } from './loadout-utils';
import LoadoutDrawerContents from './LoadoutDrawerContents';
import LoadoutDrawerDropTarget from './LoadoutDrawerDropTarget';
import LoadoutDrawerOptions from './LoadoutDrawerOptions';

// TODO: Consider moving editLoadout/addItemToLoadout/loadoutDialogOpen into Redux (actions + state)
// TODO: break out a container from the actual loadout drawer so we can lazy load the drawer

/** Is the loadout drawer currently open? */
export let loadoutDialogOpen = false;

/**
 * The Loadout editor that shows up as a sheet on the Inventory screen. You can build and edit
 * loadouts from this interface.
 */
export default function LoadoutDrawer() {
  const dispatch = useThunkDispatch();
  const defs = useDefinitions()!;
  const loadoutSheetRef = useRef<HTMLDivElement>(null);
  const modAssignmentDrawerRef = useRef<HTMLDivElement>(null);

  const stores = useSelector(storesSelector);
  const allItems = useSelector(allItemsSelector);
  const buckets = useSelector(bucketsSelector)!;

  // All state and the state of the loadout is managed through this reducer
  const [{ loadout, showClass, isNew, modPicker }, stateDispatch] = useReducer(stateReducer, {
    showClass: true,
    isNew: false,
    modPicker: {
      show: false,
    },
  });

  // Sync this global variable with our actual state. TODO: move to redux
  loadoutDialogOpen = Boolean(loadout);

  // The loadout to edit comes in from the editLoadout$ observable
  useEventBusListener(
    editLoadout$,
    useCallback(({ loadout, showClass, isNew }) => {
      stateDispatch({
        type: 'editLoadout',
        loadout,
        showClass: Boolean(showClass),
        isNew: Boolean(isNew),
      });
    }, [])
  );

  const loadoutItems = loadout?.items;

  // Turn loadout items into real DimItems
  const [items, warnitems] = useMemo(
    () => getItemsFromLoadoutItems(loadoutItems, defs, allItems),
    [defs, loadoutItems, allItems]
  );

  const onAddItem = useCallback(
    (item: DimItem, e?: MouseEvent | React.MouseEvent, equip?: boolean) =>
      stateDispatch({ type: 'addItem', item, shift: Boolean(e?.shiftKey), items, equip }),
    [items]
  );

  const onApplySocketOverrides = useCallback((item: DimItem, socketOverrides: SocketOverrides) => {
    stateDispatch({ type: 'applySocketOverrides', item, socketOverrides });
  }, []);

  const onRemoveItem = (item: DimItem, e?: React.MouseEvent) =>
    stateDispatch({ type: 'removeItem', item, shift: Boolean(e?.shiftKey), items });

  const onEquipItem = (item: DimItem) => stateDispatch({ type: 'equipItem', item, items });

  /**
   * If an item comes in on the addItem$ rx observable, add it.
   */
  useEventBusListener(
    addItem$,
    useCallback(({ item, clickEvent }) => onAddItem(item, clickEvent), [onAddItem])
  );

  const close = () => {
    stateDispatch({ type: 'reset' });
  };

  // Close the sheet on navigation
  const { pathname } = useLocation();
  useEffect(close, [pathname]);

  // This calculates the largest height of the currently open sheets.This is so we can open new
  // sheets with a minHeight that will match the open sheets. A bunch of sheets that are almost
  // the same height.
  const calculateMinSheetHeight = useCallback(() => {
    if (loadoutSheetRef.current) {
      return Math.max(
        loadoutSheetRef.current.clientHeight,
        modAssignmentDrawerRef.current?.clientHeight || 0
      );
    }
  }, []);

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

    if (loadoutToSave.name === t('Loadouts.FromEquipped')) {
      loadoutToSave = {
        ...loadoutToSave,
        name: `${loadoutToSave.name} ${new Date().toLocaleString()}`,
      };
    }

    dispatch(updateLoadout(loadoutToSave));
    close();
  };

  const saveAsNew = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!loadout) {
      return;
    }
    const newLoadout = {
      ...loadout,
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

  const savedMods = getModsFromLoadout(defs, loadout);

  /** Updates the loadout replacing it's current mods with all the mods in newMods. */
  const onUpdateMods = (newMods: PluggableInventoryItemDefinition[]) => {
    const newLoadout = { ...loadout };

    newLoadout.parameters = {
      ...newLoadout.parameters,
      mods: newMods.map((mod) => mod.hash),
    };
    stateDispatch({ type: 'update', loadout: newLoadout });
  };

  /** Removes a single mod from the loadout with the supplied itemHash. */
  const removeModByHash = (itemHash: number) => {
    const newLoadout = { ...loadout };
    const newMods = newLoadout.parameters?.mods?.length ? [...newLoadout.parameters.mods] : [];
    const index = newMods.indexOf(itemHash);
    if (index !== -1) {
      newMods.splice(index, 1);
      newLoadout.parameters = {
        ...newLoadout.parameters,
        mods: newMods,
      };
      stateDispatch({ type: 'update', loadout: newLoadout });
    }
  };

  const handleNotesChanged: React.ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    stateDispatch({ type: 'update', loadout: { ...loadout, notes: e.target.value } });
  };

  const header = (
    <div className="loadout-drawer-header">
      <h1>{isNew ? t('Loadouts.Create') : t('Loadouts.Edit')}</h1>
      <LoadoutDrawerOptions
        loadout={loadout}
        showClass={showClass}
        isNew={isNew}
        modAssignmentDrawerRef={modAssignmentDrawerRef}
        updateLoadout={(loadout) => stateDispatch({ type: 'update', loadout })}
        onUpdateMods={onUpdateMods}
        saveLoadout={onSaveLoadout}
        saveAsNew={saveAsNew}
        deleteLoadout={onDeleteLoadout}
        calculateMinSheetHeight={calculateMinSheetHeight}
      />
      {loadout.notes !== undefined && (
        <textarea
          onChange={handleNotesChanged}
          value={loadout.notes}
          placeholder={t('Loadouts.NotesPlaceholder')}
        />
      )}
      <GeneratedLoadoutStats items={items} loadout={loadout} />
    </div>
  );

  return (
    <Sheet onClose={close} ref={loadoutSheetRef} header={header}>
      <div className="loadout-drawer loadout-create">
        <div className="loadout-content">
          <LoadoutDrawerDropTarget onDroppedItem={onAddItem}>
            {warnitems.length > 0 && (
              <div className="loadout-contents">
                <p>
                  <AppIcon className="warning-icon" icon={faExclamationTriangle} />
                  {t('Loadouts.VendorsCannotEquip')}
                </p>
                <div className="loadout-warn-items">
                  {warnitems.map((item) => (
                    <div key={item.id} className="loadout-item">
                      <ClosableContainer onClose={() => onRemoveItem(item)}>
                        <InventoryItem item={item} onClick={() => fixWarnItem(item)} />
                      </ClosableContainer>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="loadout-contents">
              <LoadoutDrawerContents
                loadout={loadout}
                savedMods={savedMods}
                items={items}
                buckets={buckets}
                stores={stores}
                equip={onEquipItem}
                remove={onRemoveItem}
                add={onAddItem}
                onOpenModPicker={(query?: string) =>
                  stateDispatch({ type: 'openModPicker', query })
                }
                removeModByHash={removeModByHash}
                onApplySocketOverrides={onApplySocketOverrides}
              />
            </div>
          </LoadoutDrawerDropTarget>
        </div>
      </div>
      {modPicker.show &&
        defs.isDestiny2() &&
        ReactDOM.createPortal(
          <ModPicker
            classType={loadout.classType}
            lockedMods={savedMods}
            initialQuery={modPicker.query}
            minHeight={calculateMinSheetHeight()}
            onAccept={onUpdateMods}
            onClose={() => stateDispatch({ type: 'closeModPicker' })}
          />,
          document.body
        )}
    </Sheet>
  );
}
