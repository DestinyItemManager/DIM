import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { apiPermissionGrantedSelector } from 'app/dim-api/selectors';
import { AlertIcon } from 'app/dim-ui/AlertIcon';
import CheckButton from 'app/dim-ui/CheckButton';
import { WithSymbolsPicker } from 'app/dim-ui/destiny-symbols/SymbolsPicker';
import { useAutocomplete } from 'app/dim-ui/text-complete/text-complete';
import { t } from 'app/i18next-t';
import { getStore } from 'app/inventory/stores-helpers';
import InGameLoadoutIdentifiersSelectButton from 'app/loadout/ingame/InGameLoadoutIdentifiersSelectButton';
import { useDefinitions } from 'app/manifest/selectors';
import { searchFilterSelector } from 'app/search/search-filter';
import { AppIcon, addIcon, faRandom } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { useEventBusListener } from 'app/utils/hooks';
import { isClassCompatible } from 'app/utils/item-utils';
import { infoLog, warnLog } from 'app/utils/log';
import { useHistory } from 'app/utils/undo-redo-history';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { produce } from 'immer';
import _ from 'lodash';
import React, { useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import TextareaAutosize from 'react-textarea-autosize';
import { v4 as uuidv4 } from 'uuid';
import Sheet from '../dim-ui/Sheet';
import { DimItem } from '../inventory/item-types';
import {
  allItemsSelector,
  artifactUnlocksSelector,
  storesSelector,
  unlockedPlugSetItemsSelector,
} from '../inventory/selectors';
import LoadoutEdit from '../loadout/loadout-edit/LoadoutEdit';
import styles from './LoadoutDrawer.m.scss';
import LoadoutDrawerDropTarget from './LoadoutDrawerDropTarget';
import LoadoutDrawerFooter from './LoadoutDrawerFooter';
import LoadoutDrawerHeader from './LoadoutDrawerHeader';
import { deleteLoadout, updateLoadout } from './actions';
import {
  LoadoutUpdateFunction,
  addItem,
  dropItem,
  fillLoadoutFromEquipped,
  fillLoadoutFromUnequipped,
  randomizeFullLoadout,
  setClassType,
  setName,
  setNotes,
} from './loadout-drawer-reducer';
import { addItem$ } from './loadout-events';
import { Loadout } from './loadout-types';
import { loadoutsHashtagsSelector } from './selectors';

/**
 * The Loadout editor that shows up as a sheet on the Inventory screen. You can build and edit
 * loadouts from this interface.
 *
 * This component will always be launched after defs/stores are loaded.
 */
export default function LoadoutDrawer({
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
  onClose: () => void;
}) {
  const dispatch = useThunkDispatch();
  const defs = useDefinitions()!;
  const stores = useSelector(storesSelector);
  const allItems = useSelector(allItemsSelector);
  const unlockedPlugs = useSelector(unlockedPlugSetItemsSelector(storeId));
  const searchFilter = useSelector(searchFilterSelector);
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

  const store = getStore(stores, storeId)!;

  const onAddItem = useCallback(
    (item: DimItem, equip?: boolean) => setLoadout(addItem(defs, item, equip)),
    [defs, setLoadout]
  );

  const onDropItem = useCallback(
    (item: DimItem, equip?: boolean) => setLoadout(dropItem(defs, item, equip)),
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

  const artifactUnlocks = useSelector(artifactUnlocksSelector(storeId));

  if (!loadout || !store) {
    return null;
  }

  const handleDeleteLoadout = (close: () => void) => {
    dispatch(deleteLoadout(loadout.id));
    close();
  };

  const handleNotesChanged: React.ChangeEventHandler<HTMLTextAreaElement> = (e) =>
    setLoadout(setNotes(e.target.value));
  const handleNameChanged = withUpdater(setName);
  const handleFillLoadoutFromEquipped = () =>
    setLoadout(fillLoadoutFromEquipped(defs, store, artifactUnlocks));
  const handleFillLoadoutFromUnequipped = () => setLoadout(fillLoadoutFromUnequipped(defs, store));
  const handleRandomizeLoadout = () =>
    setLoadout(randomizeFullLoadout(defs, store, allItems, searchFilter, unlockedPlugs));

  const toggleAnyClass = (checked: boolean) =>
    setLoadout(setClassType(checked ? DestinyClass.Unknown : store.classType));

  const header = (
    <div className={styles.header}>
      <InGameLoadoutIdentifiersSelectButton loadout={loadout} setLoadout={setLoadout} />
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

  const footer = ({ onClose }: { onClose: () => void }) => (
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
    <Sheet onClose={onClose} header={header} footer={footer} allowClickThrough>
      <LoadoutDrawerDropTarget
        onDroppedItem={onDropItem}
        classType={loadout.classType}
        className={styles.body}
      >
        {$featureFlags.warnNoSync && !apiPermissionGranted && (
          <p>
            <AlertIcon /> {t('Storage.DimSyncNotEnabled')}
          </p>
        )}
        <LoadoutEdit store={store} loadout={loadout} setLoadout={setLoadout} />
        <div className={styles.inputGroup}>
          <button type="button" className="dim-button" onClick={handleFillLoadoutFromEquipped}>
            <AppIcon icon={addIcon} /> {t('Loadouts.FillFromEquipped')}
          </button>
          <button type="button" className="dim-button" onClick={handleFillLoadoutFromUnequipped}>
            <AppIcon icon={addIcon} /> {t('Loadouts.FillFromInventory')}
          </button>
          <button type="button" className="dim-button" onClick={handleRandomizeLoadout}>
            <AppIcon icon={faRandom} />{' '}
            {searchFilter === _.stubTrue
              ? t('Loadouts.RandomizeButton')
              : t('Loadouts.RandomizeSearch')}
          </button>
          <CheckButton
            checked={loadout.classType === DestinyClass.Unknown}
            onChange={toggleAnyClass}
            name="anyClass"
          >
            {t('Loadouts.Any')}
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
      return classType !== undefined && isClassCompatible(classType, loadout.classType);
    });

    if (loadout.classType === DestinyClass.Unknown && loadout.parameters) {
      // Remove fashion and non-mod loadout parameters from Any Class loadouts
      // FIXME It's really easy to forget to consider properties of LoadoutParameters here,
      // maybe some type voodoo can force us to make a decision for every property?
      if (
        loadout.parameters.mods?.length ||
        loadout.parameters.clearMods ||
        loadout.parameters.artifactUnlocks ||
        // weapons but not armor since AnyClass loadouts can't have armor
        loadout.parameters.clearWeapons
      ) {
        loadout.parameters = {
          mods: loadout.parameters.mods,
          clearMods: loadout.parameters.clearMods,
          artifactUnlocks: loadout.parameters.artifactUnlocks,
          clearWeapons: loadout.parameters.clearWeapons,
        };
      } else {
        delete loadout.parameters;
      }
    }
  });
}
