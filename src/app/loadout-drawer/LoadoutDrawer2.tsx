import CheckButton from 'app/dim-ui/CheckButton';
import { t } from 'app/i18next-t';
import { InventoryBucket } from 'app/inventory/inventory-buckets';
import { getStore } from 'app/inventory/stores-helpers';
import { showItemPicker } from 'app/item-picker/item-picker';
import { useDefinitions } from 'app/manifest/selectors';
import { addIcon, AppIcon } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { useEventBusListener } from 'app/utils/hooks';
import { itemCanBeInLoadout } from 'app/utils/item-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import { v4 as uuidv4 } from 'uuid';
import Sheet from '../dim-ui/Sheet';
import { DimItem } from '../inventory/item-types';
import { allItemsSelector, bucketsSelector, storesSelector } from '../inventory/selectors';
import LoadoutEdit from '../loadout/loadout-edit/LoadoutEdit';
import { deleteLoadout, updateLoadout } from './actions';
import { stateReducer } from './loadout-drawer-reducer';
import { addItem$, editLoadout$ } from './loadout-events';
import { getItemsFromLoadoutItems } from './loadout-item-conversion';
import { Loadout } from './loadout-types';
import styles from './LoadoutDrawer2.m.scss';
import {
  fillLoadoutFromEquipped,
  fillLoadoutFromUnequipped,
  pickLoadoutItem,
  pickLoadoutSubclass,
} from './LoadoutDrawerContents';
import LoadoutDrawerDropTarget from './LoadoutDrawerDropTarget';
import LoadoutDrawerFooter from './LoadoutDrawerFooter';
import LoadoutDrawerHeader from './LoadoutDrawerHeader';

// TODO: Consider moving editLoadout/addItemToLoadout into Redux (actions + state)
// TODO: break out a container from the actual loadout drawer so we can lazy load the drawer

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
  const itemsByBucket = _.groupBy(items, (i) => i.bucket.hash);

  const onAddItem = useCallback(
    (item: DimItem, e?: MouseEvent | React.MouseEvent, equip?: boolean) =>
      stateDispatch({
        type: 'addItem',
        item,
        shift: Boolean(e?.shiftKey),
        items,
        equip,
        stores,
      }),
    [items, stores]
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
  useEffect(() => {
    // Don't close if moving to the inventory or loadouts screen
    if (!pathname.endsWith('inventory') && !pathname.endsWith('loadouts')) {
      close();
    }
  }, [pathname]);

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

  const handleUpdateLoadout = (loadout: Loadout) => stateDispatch({ type: 'update', loadout });

  const handleNameChanged = (name: string) =>
    stateDispatch({ type: 'update', loadout: { ...loadout, name } });

  const handleRemoveItem = (item: DimItem, e?: React.MouseEvent) =>
    stateDispatch({ type: 'removeItem', item, shift: Boolean(e?.shiftKey), items });

  /** Prompt the user to select a replacement for a missing item. */
  const fixWarnItem = async (warnItem: DimItem) => {
    const loadoutClassType = loadout?.classType;

    setShowingItemPicker(true);
    try {
      const { item } = await showItemPicker({
        filterItems: (item: DimItem) =>
          (warnItem.bucket.inArmor
            ? item.bucket.hash === warnItem.bucket.hash
            : item.hash === warnItem.hash) &&
          itemCanBeInLoadout(item) &&
          (!loadout ||
            loadout.classType === DestinyClass.Unknown ||
            item.classType === loadoutClassType ||
            item.classType === DestinyClass.Unknown),
        prompt: t('Loadouts.FindAnother', {
          name: warnItem.bucket.inArmor ? warnItem.bucket.name : warnItem.name,
        }),

        // don't show information related to selected perks so we don't give the impression
        // that we will update perk selections when applying the loadout
        ignoreSelectedPerks: true,
      });

      onAddItem(item);
      handleRemoveItem(warnItem);
    } catch (e) {
    } finally {
      setShowingItemPicker(false);
    }
  };

  const setClearSpace = (clearSpace: boolean) => {
    handleUpdateLoadout({
      ...loadout,
      clearSpace,
    });
  };

  const toggleAnyClass = (checked: boolean) => {
    handleUpdateLoadout({
      ...loadout,
      classType: checked ? DestinyClass.Unknown : store.classType,
    });
  };

  const handleClickPlaceholder = ({ bucket }: { bucket: InventoryBucket }) => {
    pickLoadoutItem(loadout, bucket, ({ item }) => onAddItem(item), setShowingItemPicker);
  };
  const handleClickSubclass = (subclass: DimItem | undefined) =>
    pickLoadoutSubclass(
      loadout,
      subclass ? [subclass] : [],
      ({ item }) => onAddItem(item),
      setShowingItemPicker
    );

  const header = (
    <div>
      <LoadoutDrawerHeader loadout={loadout} onNameChanged={handleNameChanged} />
      <details className={styles.notes} open={Boolean(loadout.notes?.length)}>
        <summary>{t('MovePopup.Notes')}</summary>
        <textarea
          onChange={handleNotesChanged}
          value={loadout.notes}
          placeholder={t('Loadouts.NotesPlaceholder')}
        />
      </details>
    </div>
  );

  const footer = (
    <LoadoutDrawerFooter
      loadout={loadout}
      isNew={isNew}
      onSaveLoadout={handleSaveLoadout}
      onDeleteLoadout={handleDeleteLoadout}
    />
  );

  // TODO: minimize for better dragging/picking?
  // TODO: how to choose equipped/unequipped
  // TODO: contextual buttons!
  // TODO: undo/redo stack?
  // TODO: remove armor/subclass from any-class loadouts on save
  // TODO: build and publish a "loadouts API" via context

  return (
    <Sheet
      onClose={close}
      header={header}
      footer={footer}
      disabled={showingItemPicker}
      allowClickThrough
    >
      <LoadoutDrawerDropTarget
        onDroppedItem={onAddItem}
        classType={loadout.classType}
        className={styles.body}
      >
        <LoadoutEdit
          store={store}
          loadout={loadout}
          stateDispatch={stateDispatch}
          onClickPlaceholder={handleClickPlaceholder}
          onClickWarnItem={fixWarnItem}
          onClickSubclass={handleClickSubclass}
          onRemoveItem={handleRemoveItem}
        />
        <div className={styles.inputGroup}>
          <button
            type="button"
            className="dim-button"
            onClick={() =>
              fillLoadoutFromEquipped(loadout, itemsByBucket, store, handleUpdateLoadout)
            }
          >
            <AppIcon icon={addIcon} /> {t('Loadouts.AddEquippedItems')}
          </button>
          <button
            type="button"
            className="dim-button"
            onClick={() =>
              fillLoadoutFromUnequipped(loadout, store, ({ item }) =>
                onAddItem(item, undefined, false)
              )
            }
          >
            <AppIcon icon={addIcon} /> {t('Loadouts.AddUnequippedItems')}
          </button>
          <CheckButton
            checked={loadout.classType === DestinyClass.Unknown}
            onChange={toggleAnyClass}
            name="anyClass"
          >
            {t('Loadouts.Any')}
          </CheckButton>
          <CheckButton
            name="clearSpace"
            checked={Boolean(loadout.clearSpace)}
            onChange={setClearSpace}
          >
            {t('Loadouts.ClearSpace')}
          </CheckButton>
        </div>
      </LoadoutDrawerDropTarget>
    </Sheet>
  );
}
