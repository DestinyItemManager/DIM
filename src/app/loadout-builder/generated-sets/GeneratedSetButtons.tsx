import { t } from 'app/i18next-t';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { applyLoadout } from 'app/loadout/loadout-apply';
import { Loadout } from 'app/loadout/loadout-types';
import { showNotification } from 'app/notifications/notifications';
import { armor2PlugCategoryHashesByName } from 'app/search/d2-known-values';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import React, { Dispatch } from 'react';
import { useDispatch } from 'react-redux';
import { DimStore } from '../../inventory/store-types';
import { convertToLoadoutItem, newLoadout } from '../../loadout/loadout-utils';
import { LoadoutBuilderAction } from '../loadoutBuilderReducer';
import { ArmorSet, LockedModMap, statHashes } from '../types';
import { statTier } from '../utils';
import styles from './GeneratedSetButtons.m.scss';

/**
 * Renders the Create Loadout and Equip Items buttons for each generated set
 */
export default function GeneratedSetButtons({
  store,
  set,
  canCompareLoadouts,
  lockedArmor2Mods,
  halfTierMods,
  onLoadoutSet,
  lbDispatch,
}: {
  store: DimStore;
  set: ArmorSet;
  canCompareLoadouts: boolean;
  lockedArmor2Mods: LockedModMap;
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
    const maxNumberOfPlusFiveMods =
      5 - (lockedArmor2Mods[armor2PlugCategoryHashesByName.general]?.length || 0);

    const halfTierModsToAdd = halfTierMods.filter((mod) =>
      mod.investmentStats.some((stat) => statsWithPlus5.includes(stat.statTypeHash))
    );
    const halfTierModsCapped = halfTierModsToAdd.slice(0, maxNumberOfPlusFiveMods);

    if (statsWithPlus5.length > maxNumberOfPlusFiveMods) {
      const failures = halfTierModsToAdd
        .slice(maxNumberOfPlusFiveMods)
        .map((mod) => mod.displayProperties.name)
        .join(', ');

      showNotification({
        title: t('LoadoutBuilder.UnableToAddAllMods'),
        body: t('LoadoutBuilder.UnableToAddAllModsBody', { mods: failures }),
        type: 'warning',
      });
    }

    const newModSet = _.mapValues(lockedArmor2Mods, (mods) => mods?.map((mod) => mod.modDef));
    newModSet[armor2PlugCategoryHashesByName.general] = [
      ...halfTierModsCapped,
      ...(newModSet[armor2PlugCategoryHashesByName.general] || []),
    ];
    lbDispatch({ type: 'lockedArmor2ModsChanged', lockedArmor2Mods: newModSet });
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
