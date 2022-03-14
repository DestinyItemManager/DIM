import ClosableContainer from 'app/dim-ui/ClosableContainer';
import Sheet from 'app/dim-ui/Sheet';
import { t } from 'app/i18next-t';
import { DimItem } from 'app/inventory/item-types';
import ItemIcon from 'app/inventory/ItemIcon';
import { allItemsSelector, bucketsSelector } from 'app/inventory/selectors';
import 'app/inventory/Stores.scss';
import { showItemPicker } from 'app/item-picker/item-picker';
import { deleteLoadout, updateLoadout } from 'app/loadout-drawer/actions';
import { stateReducer } from 'app/loadout-drawer/loadout-drawer-reducer';
import { addItem$ } from 'app/loadout-drawer/loadout-events';
import { getItemsFromLoadoutItems } from 'app/loadout-drawer/loadout-item-conversion';
import { Loadout, ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import LoadoutDrawerDropTarget from 'app/loadout-drawer/LoadoutDrawerDropTarget';
import { useDefinitions } from 'app/manifest/selectors';
import { AppIcon, faExclamationTriangle } from 'app/shell/icons';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { useEventBusListener } from 'app/utils/hooks';
import { itemCanBeInLoadout } from 'app/utils/item-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import React, { useCallback, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import './loadout-drawer.scss';
import LoadoutDrawerContents from './LoadoutDrawerContents';
import LoadoutDrawerOptions from './LoadoutDrawerOptions';

/**
 * The Loadout editor that shows up as a sheet on the Inventory screen. You can build and edit
 * loadouts from this interface. This one is only used for D1, see LoadoutDrawer2 for D2's new loadout editor.
 */
export default function LoadoutDrawer({
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
   * mods are enabled, which subclass items to show, etc. Defaults to current store.
   */
  storeId?: string;
  isNew: boolean;
  showClass: boolean;
  onClose(): void;
}) {
  const dispatch = useThunkDispatch();
  const defs = useDefinitions()!;

  const allItems = useSelector(allItemsSelector);
  const buckets = useSelector(bucketsSelector)!;
  const [showingItemPicker, setShowingItemPicker] = useState(false);

  // All state and the state of the loadout is managed through this reducer
  const [{ loadout }, stateDispatch] = useReducer(stateReducer(defs), {
    loadout: initialLoadout,
  });

  const loadoutItems = loadout?.items;

  // Turn loadout items into real DimItems
  const [items, warnitems] = useMemo(
    () => getItemsFromLoadoutItems(loadoutItems, defs, storeId, buckets, allItems),
    [loadoutItems, defs, storeId, buckets, allItems]
  );

  const onAddItem = useCallback(
    (item: DimItem, equip?: boolean) =>
      stateDispatch({
        type: 'addItem',
        item,
        equip,
      }),
    []
  );

  const onRemoveItem = (resolvedItem: ResolvedLoadoutItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    stateDispatch({ type: 'removeItem', resolvedItem });
  };

  const onEquipItem = (resolvedItem: ResolvedLoadoutItem) =>
    stateDispatch({ type: 'equipItem', resolvedItem });

  /**
   * If an item comes in on the addItem$ observable, add it.
   */
  useEventBusListener(addItem$, onAddItem);

  /** Prompt the user to select a replacement for a missing item. */
  const fixWarnItem = async (li: ResolvedLoadoutItem) => {
    const loadoutClassType = loadout?.classType;
    const warnItem = li.item;

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

      onAddItem(item);
      onRemoveItem(li);
    } catch (e) {
    } finally {
      setShowingItemPicker(false);
    }
  };

  const onSaveLoadout = (
    e: React.FormEvent,
    loadoutToSave: Readonly<Loadout> | undefined = loadout,
    close: () => void
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
      id: uuidv4(), // Let it be a new ID
    };
    onSaveLoadout(e, newLoadout, close);
  };

  if (!loadout) {
    return null;
  }

  const onDeleteLoadout = () => {
    dispatch(deleteLoadout(loadout.id));
    close();
  };

  const handleNotesChanged: React.ChangeEventHandler<HTMLTextAreaElement> = (e) =>
    stateDispatch({ type: 'update', loadout: { ...loadout, notes: e.target.value } });

  const header = ({ onClose }: { onClose(): void }) => (
    <div className="loadout-drawer-header">
      <h1>{isNew ? t('Loadouts.Create') : t('Loadouts.Edit')}</h1>
      <LoadoutDrawerOptions
        loadout={loadout}
        showClass={showClass}
        isNew={isNew}
        updateLoadout={(loadout) => stateDispatch({ type: 'update', loadout })}
        saveLoadout={(e) => (isNew ? saveAsNew(e, onClose) : onSaveLoadout(e, loadout, onClose))}
        saveAsNew={(e) => saveAsNew(e, onClose)}
        deleteLoadout={onDeleteLoadout}
      />
      {loadout.notes !== undefined && (
        <textarea
          onChange={handleNotesChanged}
          value={loadout.notes}
          placeholder={t('Loadouts.NotesPlaceholder')}
          maxLength={2048}
        />
      )}
    </div>
  );

  return (
    <Sheet onClose={onClose} header={header} disabled={showingItemPicker}>
      <div className="loadout-drawer loadout-create">
        <div className="loadout-content">
          <LoadoutDrawerDropTarget onDroppedItem={onAddItem} classType={loadout.classType}>
            {warnitems.length > 0 && (
              <div className="loadout-contents">
                <p>
                  <AppIcon className="warning-icon" icon={faExclamationTriangle} />
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
                buckets={buckets}
                equip={onEquipItem}
                remove={onRemoveItem}
                add={onAddItem}
                onUpdateLoadout={(loadout) => stateDispatch({ type: 'update', loadout })}
                onShowItemPicker={setShowingItemPicker}
              />
            </div>
          </LoadoutDrawerDropTarget>
        </div>
      </div>
    </Sheet>
  );
}
