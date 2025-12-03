import { t } from 'app/i18next-t';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { applyLoadout } from 'app/loadout-drawer/loadout-apply';
import { editLoadout } from 'app/loadout-drawer/loadout-events';
import { Loadout } from 'app/loadout/loadout-types';
import { loadoutSavedSelector } from 'app/loadout/selectors';
import { useD2Definitions } from 'app/manifest/selectors';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { Dispatch } from 'react';
import { useSelector } from 'react-redux';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import { ArmorSet } from '../types';
import { updateLoadoutWithArmorSet } from '../updated-loadout';
import * as styles from './GeneratedSetButtons.m.scss';

/**
 * Renders the Create Loadout and Equip Items buttons for each generated set
 */
export default function GeneratedSetButtons({
  originalLoadout,
  store,
  set,
  items,
  lockedMods,
  canCompareLoadouts,
  lbDispatch,
}: {
  originalLoadout: Loadout;
  store: DimStore;
  set: ArmorSet;
  /** The list of items to use - these are chosen from the set's options and match what's displayed. */
  items: DimItem[];
  lockedMods: PluggableInventoryItemDefinition[];
  canCompareLoadouts: boolean;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}) {
  const defs = useD2Definitions()!;
  const dispatch = useThunkDispatch();
  const loadout = () => updateLoadoutWithArmorSet(defs, originalLoadout, set, items, lockedMods);
  const isSaved = useSelector(loadoutSavedSelector(originalLoadout.id));

  // Opens the loadout menu for the generated set
  const openLoadout = () =>
    editLoadout(loadout(), store.id, {
      showClass: false,
    });

  // Automatically equip items for this generated set to the active store
  const equipItems = () => dispatch(applyLoadout(store, loadout(), { allowUndo: true }));

  return (
    <div className={styles.buttons}>
      <button type="button" className="dim-button" onClick={openLoadout}>
        {isSaved ? t('Loadouts.UpdateLoadout') : t('Loadouts.SaveLoadout')}
      </button>
      {canCompareLoadouts && (
        <button
          type="button"
          className="dim-button"
          onClick={() => lbDispatch({ type: 'openCompareDrawer', set, items })}
        >
          {t('LoadoutBuilder.CompareLoadout')}
        </button>
      )}
      <button type="button" className="dim-button" onClick={equipItems}>
        {t('LoadoutBuilder.EquipItems', { name: store.name })}
      </button>
    </div>
  );
}
