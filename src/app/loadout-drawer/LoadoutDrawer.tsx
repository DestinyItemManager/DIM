import ClosableContainer from 'app/dim-ui/ClosableContainer';
import { t } from 'app/i18next-t';
import { SocketOverrides } from 'app/inventory/store/override-sockets';
import FashionDrawer from 'app/loadout/fashion/FashionDrawer';
import ModPicker from 'app/loadout/ModPicker';
import { useDefinitions } from 'app/manifest/selectors';
import { AppIcon, faExclamationTriangle } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { useEventBusListener } from 'app/utils/hooks';
import { itemCanBeInLoadout } from 'app/utils/item-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import ReactDOM from 'react-dom';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import { v4 as uuidv4 } from 'uuid';
import Sheet from '../dim-ui/Sheet';
import InventoryItem from '../inventory/InventoryItem';
import { DimItem, PluggableInventoryItemDefinition } from '../inventory/item-types';
import { allItemsSelector, bucketsSelector } from '../inventory/selectors';
import '../inventory/Stores.scss';
import { showItemPicker } from '../item-picker/item-picker';
import { deleteLoadout, updateLoadout } from './actions';
import { GeneratedLoadoutStats } from './GeneratedLoadoutStats';
import { stateReducer } from './loadout-drawer-reducer';
import './loadout-drawer.scss';
import { addItem$, editLoadout$ } from './loadout-events';
import { getItemsFromLoadoutItems } from './loadout-item-conversion';
import { Loadout } from './loadout-types';
import { getModsFromLoadout } from './loadout-utils';
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

  const allItems = useSelector(allItemsSelector);
  const buckets = useSelector(bucketsSelector)!;
  const [showingItemPicker, setShowingItemPicker] = useState(false);

  // All state and the state of the loadout is managed through this reducer
  const [{ loadout, showClass, storeId, isNew, modPicker, showFashionDrawer }, stateDispatch] =
    useReducer(stateReducer, {
      showClass: true,
      isNew: false,
      modPicker: {
        show: false,
      },
      showFashionDrawer: false,
    });

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

  // Turn loadout items into real DimItems
  const [items, warnitems] = useMemo(
    () => getItemsFromLoadoutItems(loadoutItems, defs, buckets, allItems),
    [defs, buckets, loadoutItems, allItems]
  );

  const onAddItem = useCallback(
    ({
      item,
      e,
      equip,
      socketOverrides,
    }: {
      item: DimItem;
      e?: MouseEvent | React.MouseEvent;
      equip?: boolean;
      socketOverrides?: SocketOverrides;
    }) =>
      stateDispatch({
        type: 'addItem',
        item,
        shift: Boolean(e?.shiftKey),
        items,
        equip,
        socketOverrides,
      }),
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
    useCallback(({ item, clickEvent }) => onAddItem({ item, e: clickEvent }), [onAddItem])
  );

  const close = () => {
    stateDispatch({ type: 'reset' });
    setShowingItemPicker(false);
  };

  // Close the sheet on navigation
  const { pathname } = useLocation();
  useEffect(close, [pathname]);

  /** Prompt the user to select a replacement for a missing item. */
  const fixWarnItem = async (warnItem: DimItem) => {
    const loadoutClassType = loadout?.classType;

    setShowingItemPicker(true);
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

      onAddItem({ item });
      onRemoveItem(warnItem);
    } catch (e) {
    } finally {
      setShowingItemPicker(false);
    }
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

  const onDroppedItem = useCallback((item) => onAddItem({ item }), [onAddItem]);

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
  const onUpdateModHashes = (mods: number[]) => stateDispatch({ type: 'updateMods', mods });
  const onUpdateMods = (newMods: PluggableInventoryItemDefinition[]) =>
    onUpdateModHashes(newMods.map((mod) => mod.hash));

  /** Removes a single mod from the loadout with the supplied itemHash. */
  const removeModByHash = (itemHash: number) =>
    stateDispatch({ type: 'removeMod', hash: itemHash });

  const handleNotesChanged: React.ChangeEventHandler<HTMLTextAreaElement> = (e) =>
    stateDispatch({ type: 'update', loadout: { ...loadout, notes: e.target.value } });

  const header = (
    <div className="loadout-drawer-header">
      <h1>{isNew ? t('Loadouts.Create') : t('Loadouts.Edit')}</h1>
      <LoadoutDrawerOptions
        loadout={loadout}
        showClass={showClass}
        isNew={isNew}
        onUpdateMods={onUpdateMods}
        updateLoadout={(loadout) => stateDispatch({ type: 'update', loadout })}
        saveLoadout={isNew ? saveAsNew : onSaveLoadout}
        saveAsNew={saveAsNew}
        deleteLoadout={onDeleteLoadout}
      />
      {loadout.notes !== undefined && (
        <textarea
          onChange={handleNotesChanged}
          value={loadout.notes}
          placeholder={t('Loadouts.NotesPlaceholder')}
        />
      )}
      <GeneratedLoadoutStats items={items} loadout={loadout} savedMods={savedMods} />
    </div>
  );

  return (
    <Sheet onClose={close} header={header} disabled={showingItemPicker}>
      <div className="loadout-drawer loadout-create">
        <div className="loadout-content">
          <LoadoutDrawerDropTarget onDroppedItem={onDroppedItem}>
            {warnitems.length > 0 && (
              <div className="loadout-contents">
                <p>
                  <AppIcon className="warning-icon" icon={faExclamationTriangle} />
                  {t('Loadouts.VendorsCannotEquip')}
                </p>
                <div className="loadout-warn-items">
                  {warnitems.map((item) => (
                    <div key={item.index} className="loadout-item">
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
                storeId={storeId}
                loadout={loadout}
                savedMods={savedMods}
                items={items}
                buckets={buckets}
                equip={onEquipItem}
                remove={onRemoveItem}
                add={onAddItem}
                onUpdateLoadout={(loadout) => stateDispatch({ type: 'update', loadout })}
                onOpenModPicker={(query?: string) =>
                  stateDispatch({ type: 'openModPicker', query })
                }
                onShowItemPicker={setShowingItemPicker}
                onOpenFashionDrawer={() =>
                  stateDispatch({ type: 'toggleFashionDrawer', show: true })
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
            owner={storeId}
            classType={loadout.classType}
            lockedMods={savedMods}
            initialQuery={modPicker.query}
            onAccept={onUpdateMods}
            onClose={() => stateDispatch({ type: 'closeModPicker' })}
          />,
          document.body
        )}
      {showFashionDrawer &&
        defs.isDestiny2() &&
        ReactDOM.createPortal(
          <FashionDrawer
            loadout={loadout}
            items={items}
            storeId={storeId}
            onModsByBucketUpdated={(modsByBucket) =>
              stateDispatch({ type: 'updateModsByBucket', modsByBucket })
            }
            onClose={() => stateDispatch({ type: 'toggleFashionDrawer', show: false })}
          />,
          document.body
        )}
    </Sheet>
  );
}
