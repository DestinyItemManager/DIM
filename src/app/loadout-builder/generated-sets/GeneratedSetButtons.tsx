import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { applyLoadout } from 'app/loadout-drawer/loadout-apply';
import { editLoadout } from 'app/loadout-drawer/loadout-events';
import { Loadout } from 'app/loadout-drawer/loadout-types';
import { convertToLoadoutItem } from 'app/loadout-drawer/loadout-utils';
import { useD2Definitions } from 'app/manifest/selectors';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import _ from 'lodash';
import { Dispatch } from 'react';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import { ArmorSet, LockableBucketHashes } from '../types';
import { statTier } from '../utils';
import styles from './GeneratedSetButtons.m.scss';

/**
 * Renders the Create Loadout and Equip Items buttons for each generated set
 */
export default function GeneratedSetButtons({
  originalLoadout,
  store,
  set,
  items,
  canCompareLoadouts,
  halfTierMods,
  lbDispatch,
}: {
  originalLoadout: Loadout;
  store: DimStore;
  set: ArmorSet;
  /** The list of items to use - these are chosen from the set's options and match what's displayed. */
  items: DimItem[];
  canCompareLoadouts: boolean;
  halfTierMods: PluggableInventoryItemDefinition[];
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}) {
  const defs = useD2Definitions()!;
  const dispatch = useThunkDispatch();
  const loadout = () => createLoadout(defs, originalLoadout, set, items);

  // Opens the loadout menu for the generated set
  const openLoadout = () =>
    editLoadout(loadout(), store.id, {
      showClass: false,
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
      mod.investmentStats.some((stat) => statsWithPlus5.includes(stat.statTypeHash))
    );

    lbDispatch({ type: 'addGeneralMods', mods });
  };

  return (
    <div className={styles.buttons}>
      <button type="button" className="dim-button" onClick={openLoadout}>
        {t('LoadoutBuilder.CreateLoadout')}
      </button>
      {canCompareLoadouts && (
        <button
          type="button"
          className="dim-button"
          onClick={() => lbDispatch({ type: 'openCompareDrawer', set })}
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

/**
 * Create a new loadout from the original prototype loadout, but with the armor items replaced with this loadout's armor.
 * Used for equipping or creating a new saved loadout.
 */
function createLoadout(
  defs: D2ManifestDefinitions,
  originalLoadout: Loadout,
  set: ArmorSet,
  items: DimItem[]
): Loadout {
  const data = {
    tier: _.sumBy(Object.values(set.stats), statTier),
  };
  const existingItemsWithoutArmor = originalLoadout.items.filter(
    (li) =>
      !LockableBucketHashes.includes(
        defs.InventoryItem.get(li.hash)?.inventory?.bucketTypeHash ?? 0
      )
  );
  const loadoutItems = items.map((item) => convertToLoadoutItem(item, true));

  // We need to add in this set's specific stat mods (artifice, general) to the list of user-chosen mods
  // TODO: pretty sure this (which was "lockedModMap.allMods") is just the list of mods in the loadout, especially if we filter "invalid" mods in the reducer?
  const allMods = [...(originalLoadout.parameters?.mods ?? []), ...set.statMods];
  return {
    ...originalLoadout,
    parameters: {
      ...originalLoadout.parameters,
      mods: allMods.length ? allMods : undefined,
    },
    items: [...existingItemsWithoutArmor, ...loadoutItems],
    name: t('Loadouts.Generated', data),
  };
}
