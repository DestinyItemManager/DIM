import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import CheckButton from 'app/dim-ui/CheckButton';
import { t } from 'app/i18next-t';
import { InventoryBucket } from 'app/inventory/inventory-buckets';
import { SocketOverrides } from 'app/inventory/store/override-sockets';
import { getCurrentStore, getStore } from 'app/inventory/stores-helpers';
import { showItemPicker } from 'app/item-picker/item-picker';
import { pickSubclass } from 'app/loadout/item-utils';
import { useDefinitions } from 'app/manifest/selectors';
import { addIcon, AppIcon } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { useEventBusListener } from 'app/utils/hooks';
import { itemCanBeInLoadout } from 'app/utils/item-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import produce from 'immer';
import React, { useCallback, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import Sheet from '../dim-ui/Sheet';
import { DimItem } from '../inventory/item-types';
import { storesSelector } from '../inventory/selectors';
import LoadoutEdit from '../loadout/loadout-edit/LoadoutEdit';
import { deleteLoadout, updateLoadout } from './actions';
import { stateReducer } from './loadout-drawer-reducer';
import { addItem$ } from './loadout-events';
import { Loadout, ResolvedLoadoutItem } from './loadout-types';
import { createSubclassDefaultSocketOverrides } from './loadout-utils';
import styles from './LoadoutDrawer2.m.scss';
import LoadoutDrawerDropTarget from './LoadoutDrawerDropTarget';
import LoadoutDrawerFooter from './LoadoutDrawerFooter';
import LoadoutDrawerHeader from './LoadoutDrawerHeader';

// TODO: Consider moving editLoadout/addItemToLoadout into Redux (actions + state)
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
   * mods are enabled, which subclass items to show, etc. Defaults to current store.
   */
  storeId?: string;
  isNew: boolean;
  onClose(): void;
}) {
  const dispatch = useThunkDispatch();
  const defs = useDefinitions()!;
  const stores = useSelector(storesSelector);
  const [showingItemPicker, setShowingItemPicker] = useState(false);

  // All state and the state of the loadout is managed through this reducer
  const [{ loadout }, stateDispatch] = useReducer(stateReducer(defs), {
    loadout: initialLoadout,
  });

  const store = storeId
    ? getStore(stores, storeId)
    : stores.find((s) => !s.isVault && s.classType === loadout?.classType) ??
      getCurrentStore(stores);

  const onAddItem = useCallback(
    (item: DimItem, equip?: boolean, socketOverrides?: SocketOverrides) =>
      stateDispatch({
        type: 'addItem',
        item,
        equip,
        socketOverrides,
      }),
    []
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

    dispatch(updateLoadout(loadoutToSave));
    close();
  };

  if (!loadout || !store) {
    return null;
  }

  const handleDeleteLoadout = (close: () => void) => {
    dispatch(deleteLoadout(loadout.id));
    close();
  };

  const handleNotesChanged: React.ChangeEventHandler<HTMLTextAreaElement> = (e) =>
    stateDispatch({ type: 'setNotes', notes: e.target.value });
  const handleNameChanged = (name: string) => stateDispatch({ type: 'setName', name });
  const handleRemoveItem = (resolvedItem: ResolvedLoadoutItem) =>
    stateDispatch({ type: 'removeItem', resolvedItem });
  const handleFillLoadoutFromEquipped = () =>
    stateDispatch({ type: 'fillLoadoutFromEquipped', store });
  const handleFillLoadoutFromUnequipped = () =>
    stateDispatch({ type: 'fillLoadoutFromUnequipped', store });

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

        // don't show information related to selected perks so we don't give the impression
        // that we will update perk selections when applying the loadout
        ignoreSelectedPerks: true,
      });

      onAddItem(item);
      handleRemoveItem(li);
    } catch (e) {
    } finally {
      setShowingItemPicker(false);
    }
  };

  const setClearSpace = (clearSpace: boolean) =>
    stateDispatch({ type: 'setClearSpace', clearSpace });

  const toggleAnyClass = (checked: boolean) =>
    stateDispatch({
      type: 'setClassType',
      classType: checked ? DestinyClass.Unknown : store.classType,
    });

  const handleClickPlaceholder = ({
    bucket,
    equip,
  }: {
    bucket: InventoryBucket;
    equip: boolean;
  }) => {
    pickLoadoutItem(loadout, bucket, (item) => onAddItem(item, equip), setShowingItemPicker);
  };

  const handleClickSubclass = () =>
    pickLoadoutSubclass(loadout, storeId, onAddItem, setShowingItemPicker);

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

  // TODO: use this on the old loadout editor?
  const footer = ({ onClose }: { onClose(): void }) => (
    <LoadoutDrawerFooter
      loadout={loadout}
      isNew={isNew}
      onSaveLoadout={(e, saveAsNew) => handleSaveLoadout(e, onClose, saveAsNew)}
      onDeleteLoadout={() => handleDeleteLoadout(onClose)}
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
        <LoadoutEdit
          store={store}
          loadout={loadout}
          stateDispatch={stateDispatch}
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
            onChange={setClearSpace}
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
      if (loadout.parameters.mods?.length) {
        loadout.parameters = { mods: loadout.parameters.mods };
      } else {
        delete loadout.parameters;
      }
    }
  });
}

async function pickLoadoutItem(
  loadout: Loadout,
  bucket: InventoryBucket,
  add: (item: DimItem) => void,
  onShowItemPicker: (shown: boolean) => void
) {
  const loadoutClassType = loadout?.classType;
  function loadoutHasItem(item: DimItem) {
    return loadout?.items.some((i) => i.id === item.id && i.hash === item.hash);
  }

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
        !loadoutHasItem(item),
      prompt: t('Loadouts.ChooseItem', { name: bucket.name }),

      // don't show information related to selected perks so we don't give the impression
      // that we will update perk selections when applying the loadout
      ignoreSelectedPerks: true,
    });

    add(item);
  } catch (e) {
  } finally {
    onShowItemPicker(false);
  }
}

async function pickLoadoutSubclass(
  loadout: Loadout,
  storeId: string | undefined,
  add: (item: DimItem, equip?: boolean, socketOverrides?: SocketOverrides) => void,
  onShowItemPicker: (shown: boolean) => void
) {
  const loadoutClassType = loadout.classType;
  const loadoutHasItem = (item: DimItem) => loadout.items.some((i) => i.hash === item.hash);

  const subclassItemFilter = (item: DimItem) =>
    item.bucket.hash === BucketHashes.Subclass &&
    item.classType === loadoutClassType &&
    (!storeId || item.owner === storeId) &&
    itemCanBeInLoadout(item) &&
    !loadoutHasItem(item);

  onShowItemPicker(true);
  const item = await pickSubclass(subclassItemFilter);
  if (item) {
    add(item, undefined, createSubclassDefaultSocketOverrides(item));
  }
  onShowItemPicker(false);
}
