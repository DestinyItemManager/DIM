import { AlertIcon } from 'app/dim-ui/AlertIcon';
import ClosableContainer from 'app/dim-ui/ClosableContainer';
import Sheet from 'app/dim-ui/Sheet';
import { t } from 'app/i18next-t';
import ItemIcon from 'app/inventory/ItemIcon';
import { DimItem } from 'app/inventory/item-types';
import { allItemsSelector, createItemContextSelector } from 'app/inventory/selectors';
import { useItemPicker } from 'app/item-picker/item-picker';
import LoadoutDrawerDropTarget from 'app/loadout-drawer/LoadoutDrawerDropTarget';
import LoadoutDrawerFooter from 'app/loadout-drawer/LoadoutDrawerFooter';
import {
  addItem,
  removeItem,
  setNotes,
  toggleEquipped,
} from 'app/loadout-drawer/loadout-drawer-reducer';
import { addItem$ } from 'app/loadout-drawer/loadout-events';
import { getItemsFromLoadoutItems } from 'app/loadout-drawer/loadout-item-conversion';
import { deleteLoadout, updateLoadout } from 'app/loadout/actions';
import { Loadout, ResolvedLoadoutItem } from 'app/loadout/loadout-types';
import { useD1Definitions } from 'app/manifest/selectors';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { useEventBusListener } from 'app/utils/hooks';
import { isItemLoadoutCompatible, itemCanBeInLoadout } from 'app/utils/item-utils';
import React, { Dispatch, SetStateAction, useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import TextareaAutosize from 'react-textarea-autosize';
import LoadoutDrawerContents from './LoadoutDrawerContents';
import LoadoutDrawerOptions from './LoadoutDrawerOptions';
import './loadout-drawer.scss';

/**
 * The Loadout editor that shows up as a sheet on the Inventory screen. You can build and edit
 * loadouts from this interface. This one is only used for D1, see LoadoutDrawer2 for D2's new loadout editor.
 */
export default function D1LoadoutDrawer({
  initialLoadout,
  storeId,
  isNew,
  showClass,
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
  showClass: boolean;
  onClose: () => void;
}) {
  const dispatch = useThunkDispatch();
  const [loadout, setLoadout] = useState(initialLoadout);

  const onSaveLoadout = (
    e: React.FormEvent,
    loadoutToSave: Readonly<Loadout> | undefined = loadout,
    close: () => void,
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

  const saveAsNew = (e: React.FormEvent, close: () => void) => {
    e.preventDefault();

    if (!loadout) {
      return;
    }
    const newLoadout = {
      ...loadout,
      id: globalThis.crypto.randomUUID(), // Let it be a new ID
    };
    onSaveLoadout(e, newLoadout, close);
  };

  if (!loadout) {
    return null;
  }

  const onDeleteLoadout = (onClose: () => void) => {
    dispatch(deleteLoadout(loadout.id));
    onClose();
  };

  const handleNotesChanged: React.ChangeEventHandler<HTMLTextAreaElement> = (e) =>
    setLoadout(setNotes(e.target.value));

  const header = (
    <div>
      <LoadoutDrawerOptions loadout={loadout} showClass={showClass} setLoadout={setLoadout} />
      {loadout.notes !== undefined && (
        <TextareaAutosize
          onChange={handleNotesChanged}
          value={loadout.notes}
          placeholder={t('Loadouts.NotesPlaceholder')}
          maxLength={2048}
        />
      )}
    </div>
  );

  const footer = ({ onClose }: { onClose: () => void }) => (
    <LoadoutDrawerFooter
      loadout={loadout}
      isNew={isNew}
      onSaveLoadout={(e, isNew) =>
        isNew ? saveAsNew(e, onClose) : onSaveLoadout(e, loadout, onClose)
      }
      onDeleteLoadout={() => onDeleteLoadout(onClose)}
    />
  );

  return (
    <Sheet onClose={onClose} header={header} footer={footer}>
      <LoadoutDrawerBody loadout={loadout} storeId={storeId} setLoadout={setLoadout} />
    </Sheet>
  );
}

// This is mostly separated out so that its use of useItemPicker is under the Sheet in the component tree.
function LoadoutDrawerBody({
  loadout,
  storeId,
  setLoadout,
}: {
  loadout: Loadout;
  storeId: string;
  setLoadout: Dispatch<SetStateAction<Loadout>>;
}) {
  const defs = useD1Definitions()!;
  const showItemPicker = useItemPicker();

  const allItems = useSelector(allItemsSelector);
  const itemCreationContext = useSelector(createItemContextSelector);

  const loadoutItems = loadout?.items;

  // Turn loadout items into real DimItems
  const [items, warnitems] = useMemo(
    () =>
      getItemsFromLoadoutItems(
        itemCreationContext,
        loadoutItems,
        storeId,
        allItems,
        undefined,
        defs,
      ),
    [itemCreationContext, loadoutItems, storeId, allItems, defs],
  );

  const onAddItem = useCallback(
    (item: DimItem, equip?: boolean) => setLoadout(addItem(defs, item, equip)),
    [defs, setLoadout],
  );

  // If an item comes in on the addItem$ observable, add it.
  useEventBusListener(addItem$, onAddItem);

  const onRemoveItem = (resolvedItem: ResolvedLoadoutItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLoadout(removeItem(defs, resolvedItem));
  };

  const handleToggleEquipped = (item: ResolvedLoadoutItem) =>
    setLoadout(toggleEquipped(defs, item));

  /** Prompt the user to select a replacement for a missing item. */
  const fixWarnItem = async (li: ResolvedLoadoutItem) => {
    const warnItem = li.item;

    const item = await showItemPicker({
      filterItems: (item: DimItem) =>
        item.hash === warnItem.hash &&
        itemCanBeInLoadout(item) &&
        (!loadout || isItemLoadoutCompatible(item.classType, loadout.classType)),
      prompt: t('Loadouts.FindAnother', { name: warnItem.name }),
    });

    if (item) {
      onAddItem(item);
      onRemoveItem(li);
    }
  };

  return (
    <div className="loadout-drawer loadout-create">
      <div className="loadout-content">
        <LoadoutDrawerDropTarget onDroppedItem={onAddItem} classType={loadout.classType}>
          {warnitems.length > 0 && (
            <div className="loadout-contents">
              <p>
                <AlertIcon />
                {t('Loadouts.VendorsCannotEquip')}
              </p>
              <div className="loadout-warn-items">
                {warnitems.map((li) => (
                  <div key={li.item.id} className="loadout-item" onClick={() => fixWarnItem(li)}>
                    <ClosableContainer onClose={(e) => onRemoveItem(li, e)}>
                      <ItemIcon item={li.item} />
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
              items={items}
              equip={handleToggleEquipped}
              remove={onRemoveItem}
              add={onAddItem}
              setLoadout={setLoadout}
            />
          </div>
        </LoadoutDrawerDropTarget>
      </div>
    </div>
  );
}
