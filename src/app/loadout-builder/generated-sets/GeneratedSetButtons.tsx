import { t } from 'app/i18next-t';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { applyLoadout } from 'app/loadout-drawer/loadout-apply';
import { editLoadout } from 'app/loadout-drawer/loadout-events';
import { Loadout } from 'app/loadout/loadout-types';
import { useD2Definitions } from 'app/manifest/selectors';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { Dispatch } from 'react';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import { ArmorSet } from '../types';
import { updateLoadoutWithArmorSet } from '../updated-loadout';
import styles from './GeneratedSetButtons.m.scss';

/**
 * Renders the Create Loadout and Equip Items buttons for each generated set
 */
export default function GeneratedSetButtons({
  originalLoadout,
  store,
  set,
  items,
  isEditingExistingLoadout,
  lockedMods,
  canCompareLoadouts,
  halfTierMods,
  lbDispatch,
}: {
  originalLoadout: Loadout;
  store: DimStore;
  set: ArmorSet;
  /** The list of items to use - these are chosen from the set's options and match what's displayed. */
  items: DimItem[];
  lockedMods: PluggableInventoryItemDefinition[];
  isEditingExistingLoadout: boolean;
  canCompareLoadouts: boolean;
  halfTierMods: PluggableInventoryItemDefinition[];
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}) {
  const defs = useD2Definitions()!;
  const dispatch = useThunkDispatch();
  const loadout = () => updateLoadoutWithArmorSet(defs, originalLoadout, set, items, lockedMods);

  // Opens the loadout menu for the generated set
  const openLoadout = () =>
    editLoadout(loadout(), store.id, {
      showClass: false,
      isNew: !isEditingExistingLoadout || originalLoadout.id === 'equipped',
    });

  // Automatically equip items for this generated set to the active store
  const equipItems = () => dispatch(applyLoadout(store, loadout(), { allowUndo: true }));

  const statsWithPlus5: number[] = [];

  for (const [statHash, value] of Object.entries(set.stats)) {
    if (value % 10 > 4) {
      statsWithPlus5.push(parseInt(statHash, 10));
    }
  }

  const onQuickAddHalfTierMods = () => {
    // Note that half tier mods are already sorted in our desired stat order so we just keep their ordering.
    const mods = halfTierMods.filter((mod) =>
      mod.investmentStats.some((stat) => statsWithPlus5.includes(stat.statTypeHash)),
    );

    lbDispatch({ type: 'addGeneralMods', mods });
  };

  return (
    <div className={styles.buttons}>
      <button type="button" className="dim-button" onClick={openLoadout}>
        {isEditingExistingLoadout ? t('Loadouts.UpdateLoadout') : t('Loadouts.SaveLoadout')}
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
      {Boolean(statsWithPlus5.length) && Boolean(halfTierMods.length) && (
        <button type="button" className="dim-button" onClick={onQuickAddHalfTierMods}>
          {t('LoadoutBuilder.AddHalfTierMods')}
        </button>
      )}
    </div>
  );
}
