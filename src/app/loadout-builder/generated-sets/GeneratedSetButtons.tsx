import { LoadoutParameters } from '@destinyitemmanager/dim-api-types';
import { t } from 'app/i18next-t';
import { DimItem, PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DimStore } from 'app/inventory/store-types';
import { applyLoadout } from 'app/loadout-drawer/loadout-apply';
import { Loadout, ResolvedLoadoutItem } from 'app/loadout-drawer/loadout-types';
import { convertToLoadoutItem, newLoadout } from 'app/loadout-drawer/loadout-utils';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { Dispatch } from 'react';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import { ArmorSet } from '../types';
import { statTier } from '../utils';
import styles from './GeneratedSetButtons.m.scss';

/**
 * Renders the Create Loadout and Equip Items buttons for each generated set
 */
export default function GeneratedSetButtons({
  store,
  set,
  items,
  subclass,
  notes,
  params,
  canCompareLoadouts,
  halfTierMods,
  onLoadoutSet,
  lbDispatch,
}: {
  store: DimStore;
  set: ArmorSet;
  items: DimItem[];
  subclass: ResolvedLoadoutItem | undefined;
  notes?: string;
  params: LoadoutParameters;
  canCompareLoadouts: boolean;
  halfTierMods: PluggableInventoryItemDefinition[];
  onLoadoutSet(loadout: Loadout): void;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}) {
  const dispatch = useThunkDispatch();

  // Opens the loadout menu for the generated set
  const openLoadout = () => {
    onLoadoutSet(createLoadout(store.classType, set, items, subclass, params, notes));
  };

  // Automatically equip items for this generated set to the active store
  const equipItems = () => {
    const loadout = createLoadout(store.classType, set, items, subclass, params, notes);
    return dispatch(applyLoadout(store, loadout, { allowUndo: true }));
  };

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
      {Boolean(statsWithPlus5.length) && (
        <button type="button" className="dim-button" onClick={onQuickAddHalfTierMods}>
          {t('LoadoutBuilder.AddHalfTierMods')}
        </button>
      )}
    </div>
  );
}

/**
 * Create a Loadout object, used for equipping or creating a new saved loadout
 */
function createLoadout(
  classType: DestinyClass,
  set: ArmorSet,
  items: DimItem[],
  subclass: ResolvedLoadoutItem | undefined,
  params: LoadoutParameters,
  notes?: string
): Loadout {
  const data = {
    tier: _.sumBy(Object.values(set.stats), statTier),
  };
  const loadoutItems = items.map((item) => convertToLoadoutItem(item, true));

  if (subclass) {
    loadoutItems.push(subclass.loadoutItem);
  }

  const loadout = newLoadout(t('Loadouts.Generated', data), loadoutItems, classType);
  loadout.notes = notes;
  loadout.parameters = params;
  return loadout;
}
