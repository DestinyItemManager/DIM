import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { apiPermissionGrantedSelector } from 'app/dim-api/selectors';
import { AlertIcon } from 'app/dim-ui/AlertIcon';
import CheckButton from 'app/dim-ui/CheckButton';
import { WithSymbolsPicker } from 'app/dim-ui/destiny-symbols/SymbolsPicker';
import { useAutocomplete } from 'app/dim-ui/text-complete/text-complete';
import { t } from 'app/i18next-t';
import { InventoryBucket } from 'app/inventory/inventory-buckets';
import { DimStore } from 'app/inventory/store-types';
import { SocketOverrides } from 'app/inventory/store/override-sockets';
import { getStore } from 'app/inventory/stores-helpers';
import { showItemPicker } from 'app/item-picker/item-picker';
import { pickSubclass } from 'app/loadout/item-utils';
import { useDefinitions } from 'app/manifest/selectors';
import { addIcon, AppIcon } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { useEventBusListener } from 'app/utils/hooks';
import { itemCanBeInLoadout } from 'app/utils/item-utils';
import { infoLog, warnLog } from 'app/utils/log';
import { useHistory } from 'app/utils/undo-redo-history';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import produce from 'immer';
import React, { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import TextareaAutosize from 'react-textarea-autosize';
import { v4 as uuidv4 } from 'uuid';
import Sheet from '../dim-ui/Sheet';
import { DimItem } from '../inventory/item-types';
import { storesSelector } from '../inventory/selectors';
import LoadoutEdit from '../loadout/loadout-edit/LoadoutEdit';
import { deleteLoadout, updateLoadout } from './actions';
import {
  addItem,
  fillLoadoutFromEquipped,
  fillLoadoutFromUnequipped,
  LoadoutUpdateFunction,
  removeItem,
  setClassType,
  setClearSpace,
  setName,
  setNotes,
} from './loadout-drawer-reducer';
import { addItem$ } from './loadout-events';
import { Loadout, ResolvedLoadoutItem } from './loadout-types';
import { createSubclassDefaultSocketOverrides, findSameLoadoutItemIndex } from './loadout-utils';
import styles from './LoadoutDrawer2.m.scss';
import LoadoutDrawerDropTarget from './LoadoutDrawerDropTarget';
import LoadoutDrawerFooter from './LoadoutDrawerFooter';
import LoadoutDrawerHeader from './LoadoutDrawerHeader';
import { loadoutsHashtagsSelector } from './selectors';

// TODO: break out a container from the actual loadout drawer so we can lazy load the drawer

/**
 * The Loadout editor that shows up as a sheet on the Inventory screen. You can build and edit
 * loadouts from this interface.
 *
 * This component will always be launched after defs/stores are loaded.
 */
export default function LoadoutDrawer2({
  initialLoadout,
  storeId,
  isNew,
  onClose,
}: {
  initialLoadout: Loadout;
  /**
   * The store that provides context to how this loadout is being edited from.
   * The store this edit session was launched from. This is to help pick which
   * mods are enabled, which subclass items to show, etc.
   */
  storeId: string;
  isNew: boolean;
  onClose(): void;
}) {
  const dispatch = useThunkDispatch();
  const defs = useDefinitions()!;
  const stores = useSelector(storesSelector);
  const [showingItemPicker, setShowingItemPicker] = useState(false);
  const {
    state: loadout,
    setState: setLoadout,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory(initialLoadout);
  const apiPermissionGranted = useSelector(apiPermissionGrantedSelector);

  function withUpdater<T extends unknown[]>(fn: (...args: T) => LoadoutUpdateFunction) {
    return (...args: T) => setLoadout(fn(...args));
  }
  function withDefsUpdater<T extends unknown[]>(
    fn: (defs: D1ManifestDefinitions | D2ManifestDefinitions, ...args: T) => LoadoutUpdateFunction
  ) {
    return (...args: T) => setLoadout(fn(defs, ...args));
  }

  const store = getStore(stores, storeId)!;

  const onAddItem = useCallback(
    (item: DimItem, equip?: boolean, socketOverrides?: SocketOverrides) =>
      setLoadout(addItem(defs, item, equip, socketOverrides)),
    [defs, setLoadout]
  );

  /**
   * If an item comes in on the addItem$ observable, add it.
   */
  useEventBusListener(addItem$, onAddItem);

  const handleSaveLoadout = (e: React.FormEvent, close: () => void, saveAsNew: boolean) => {
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

    loadoutToSave = filterLoadoutToAllowedItems(defs, loadoutToSave);

    if (
      $featureFlags.warnNoSync &&
      !apiPermissionGranted &&
      'storage' in navigator &&
      'persist' in navigator.storage
    ) {
      navigator.storage.persist().then((isPersisted) => {
        if (isPersisted) {
          infoLog('storage', 'Persisted storage granted');
        } else {
          warnLog('storage', 'Persisted storage not granted');
        }
      });
    }

    dispatch(updateLoadout(loadoutToSave));
    close();
  };

  const ref = useRef<HTMLTextAreaElement>(null);
  const tags = useSelector(loadoutsHashtagsSelector);
  useAutocomplete(ref, tags);

  if (!loadout || !store) {
    return null;
  }

  const handleClickPlaceholder = ({
    bucket,
    equip,
  }: {
    bucket: InventoryBucket;
    equip: boolean;
  }) => {
    pickLoadoutItem(
      defs,
      loadout,
      bucket,
      (item) => onAddItem(item, equip),
      setShowingItemPicker,
      store
    );
  };

  const handleRemoveItem = withDefsUpdater(removeItem);

  /** Prompt the user to select a replacement for a missing item. */
  const fixWarnItem = async (li: ResolvedLoadoutItem) => {
    const loadoutClassType = loadout?.classType;
    const warnItem = li.item;

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
      });

      onAddItem(item);
      handleRemoveItem(li);
    } catch (e) {
    } finally {
      setShowingItemPicker(false);
    }
  };

  const handleClickSubclass = () =>
    pickLoadoutSubclass(loadout, storeId, onAddItem, setShowingItemPicker);

  const handleDeleteLoadout = (close: () => void) => {
    dispatch(deleteLoadout(loadout.id));
    close();
  };

  const handleNotesChanged: React.ChangeEventHandler<HTMLTextAreaElement> = (e) =>
    setLoadout(setNotes(e.target.value));
  const handleNameChanged = withUpdater(setName);
  const handleFillLoadoutFromEquipped = () => setLoadout(fillLoadoutFromEquipped(defs, store));
  const handleFillLoadoutFromUnequipped = () => setLoadout(fillLoadoutFromUnequipped(defs, store));

  const handleSetClearSpace = withUpdater(setClearSpace);

  const toggleAnyClass = (checked: boolean) =>
    setLoadout(setClassType(checked ? DestinyClass.Unknown : store.classType));

  const header = (
    <div>
      <LoadoutDrawerHeader loadout={loadout} onNameChanged={handleNameChanged} />
      <details className={styles.notes} open={Boolean(loadout.notes?.length)}>
        <summary>{t('MovePopup.Notes')}</summary>
        <WithSymbolsPicker input={ref} setValue={(val) => setLoadout(setNotes(val))}>
          <TextareaAutosize
            onChange={handleNotesChanged}
            ref={ref}
            value={loadout.notes}
            maxLength={2048}
            placeholder={t('Loadouts.NotesPlaceholder')}
          />
        </WithSymbolsPicker>
      </details>
    </div>
  );

  const footer = ({ onClose }: { onClose(): void }) => (
    <LoadoutDrawerFooter
      loadout={loadout}
      isNew={isNew}
      onSaveLoadout={(e, saveAsNew) => handleSaveLoadout(e, onClose, saveAsNew)}
      onDeleteLoadout={() => handleDeleteLoadout(onClose)}
      undo={undo}
      redo={redo}
      hasUndo={canUndo}
      hasRedo={canRedo}
    />
  );

  // TODO: minimize for better dragging/picking?
  // TODO: how to choose equipped/unequipped
  // TODO: contextual buttons!
  // TODO: undo/redo stack?
  // TODO: build and publish a "loadouts API" via context?

  return (
    <Sheet
      onClose={onClose}
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
        {$featureFlags.warnNoSync && !apiPermissionGranted && (
          <p>
            <AlertIcon /> {t('Storage.DimSyncNotEnabled')}
          </p>
        )}
        <LoadoutEdit
          store={store}
          loadout={loadout}
          setLoadout={setLoadout}
          onClickPlaceholder={handleClickPlaceholder}
          onClickWarnItem={fixWarnItem}
          onClickSubclass={handleClickSubclass}
        />
        <div className={styles.inputGroup}>
          <button type="button" className="dim-button" onClick={handleFillLoadoutFromEquipped}>
            <AppIcon icon={addIcon} /> {t('Loadouts.FillFromEquipped')}
          </button>
          <button type="button" className="dim-button" onClick={handleFillLoadoutFromUnequipped}>
            <AppIcon icon={addIcon} /> {t('Loadouts.FillFromInventory')}
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
            onChange={handleSetClearSpace}
          >
            {t('Loadouts.ClearSpace')}
          </CheckButton>
        </div>
      </LoadoutDrawerDropTarget>
    </Sheet>
  );
}

/**
 * Remove items and settings that don't match the loadout's class type.
 */
function filterLoadoutToAllowedItems(
  defs: D2ManifestDefinitions | D1ManifestDefinitions,
  loadoutToSave: Readonly<Loadout>
): Readonly<Loadout> {
  return produce(loadoutToSave, (loadout) => {
    // Filter out items that don't fit the class type
    loadout.items = loadout.items.filter((loadoutItem) => {
      const classType = defs.InventoryItem.get(loadoutItem.hash)?.classType;
      return (
        classType !== undefined &&
        (classType === DestinyClass.Unknown || classType === loadout.classType)
      );
    });

    if (loadout.classType === DestinyClass.Unknown && loadout.parameters) {
      // Remove fashion and non-mod loadout parameters from Any Class loadouts
      if (loadout.parameters.mods?.length || loadout.parameters.clearMods) {
        loadout.parameters = {
          mods: loadout.parameters.mods,
          clearMods: loadout.parameters.clearMods,
        };
      } else {
        delete loadout.parameters;
      }
    }
  });
}

async function pickLoadoutItem(
  defs: D1ManifestDefinitions | D2ManifestDefinitions,
  loadout: Loadout,
  bucket: InventoryBucket,
  add: (item: DimItem) => void,
  onShowItemPicker: (shown: boolean) => void,
  store: DimStore
) {
  const loadoutClassType = loadout?.classType;
  const loadoutHasItem = (item: DimItem) =>
    findSameLoadoutItemIndex(defs, loadout.items, item) !== -1;
  onShowItemPicker(true);
  try {
    const { item } = await showItemPicker({
      filterItems: (item: DimItem) =>
        item.bucket.hash === bucket.hash &&
        (!loadout ||
          loadout.classType === DestinyClass.Unknown ||
          item.classType === loadoutClassType ||
          item.classType === DestinyClass.Unknown) &&
        itemCanBeInLoadout(item) &&
        !loadoutHasItem(item) &&
        (!item.notransfer || item.owner === store.id),
      prompt: t('Loadouts.ChooseItem', { name: bucket.name }),
    });

    add(item);
  } catch (e) {
  } finally {
    onShowItemPicker(false);
  }
}

async function pickLoadoutSubclass(
  loadout: Loadout,
  storeId: string,
  add: (item: DimItem, equip?: boolean, socketOverrides?: SocketOverrides) => void,
  onShowItemPicker: (shown: boolean) => void
) {
  const loadoutClassType = loadout.classType;
  const loadoutHasItem = (item: DimItem) => loadout.items.some((i) => i.hash === item.hash);

  const subclassItemFilter = (item: DimItem) =>
    item.bucket.hash === BucketHashes.Subclass &&
    item.classType === loadoutClassType &&
    item.owner === storeId &&
    itemCanBeInLoadout(item) &&
    !loadoutHasItem(item);

  onShowItemPicker(true);
  const item = await pickSubclass(subclassItemFilter);
  if (item) {
    add(item, undefined, createSubclassDefaultSocketOverrides(item));
  }
  onShowItemPicker(false);
}
