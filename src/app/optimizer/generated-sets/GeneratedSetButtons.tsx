import { t } from 'app/i18next-t';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { applyLoadout } from 'app/loadout/loadout-apply';
import { Loadout } from 'app/loadout/loadout-types';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import React, { Dispatch } from 'react';
import { useDispatch } from 'react-redux';
import { DimStore } from '../../inventory/store-types';
import { convertToLoadoutItem, newLoadout } from '../../loadout/loadout-utils';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import { ArmorSet, statHashes } from '../types';
import { statTier } from '../utils';
import styles from './GeneratedSetButtons.m.scss';

/**
 * Renders the Create Loadout and Equip Items buttons for each generated set
 */
export default function GeneratedSetButtons({
  store,
  set,
  canCompareLoadouts,
  halfTierMods,
  onLoadoutSet,
  lbDispatch,
}: {
  store: DimStore;
  set: ArmorSet;
  canCompareLoadouts: boolean;
  halfTierMods: PluggableInventoryItemDefinition[];
  onLoadoutSet(loadout: Loadout): void;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
}) {
  const dispatch = useDispatch();

  // Opens the loadout menu for the generated set
  const openLoadout = () => {
    onLoadoutSet(createLoadout(store.classType, set));
  };

  // Automatically equip items for this generated set to the active store
  const equipItems = () => {
    const loadout = createLoadout(store.classType, set);
    return dispatch(applyLoadout(store, loadout, true));
  };

  const statsWithPlus5: number[] = [];

  for (const [stat, value] of Object.entries(set.stats)) {
    if (value % 10 > 4) {
      statsWithPlus5.push(statHashes[stat]);
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
function createLoadout(classType: DestinyClass, set: ArmorSet): Loadout {
  const data = {
    tier: _.sumBy(Object.values(set.stats), statTier),
  };
  const loadout = newLoadout(
    t('Loadouts.Generated', data),
    set.armor.map((items) => convertToLoadoutItem(items[0], true))
  );
  loadout.classType = classType;
  return loadout;
}
