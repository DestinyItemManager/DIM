import copy from 'fast-copy';
import { t } from 'app/i18next-t';
import _ from 'lodash';
import React from 'react';
import { DimStore } from '../../inventory/store-types';
import { newLoadout } from '../../loadout/loadout-utils';
import { dimLoadoutService, Loadout, LoadoutClass } from '../../loadout/loadout.service';
import { ArmorSet } from '../types';

/**
 * Renders the Create Loadout and Equip Items buttons for each generated set
 */
export default function GeneratedSetButtons({
  store,
  set,
  numSets,
  onLoadoutSet
}: {
  store: DimStore;
  set: ArmorSet;
  numSets: number;
  onLoadoutSet(loadout: Loadout): void;
}) {
  // Opens the loadout menu for the generated set
  const openLoadout = () => {
    onLoadoutSet(createLoadout(store.class, set));
  };

  // Automatically equip items for this generated set to the active store
  const equipItems = () => {
    const loadout = createLoadout(store.class, set);
    return dimLoadoutService.applyLoadout(store, loadout, true);
  };

  return (
    <div className="generated-build-buttons">
      <span className="generated-combos">
        {/* TODO: Say something if there's perk filtering? */}
        {numSets.toLocaleString()} combinations
      </span>
      <button className="dim-button" onClick={openLoadout}>
        {t('LoadoutBuilder.CreateLoadout')}
      </button>
      <button className="dim-button equip-button" onClick={equipItems}>
        {t('LoadoutBuilder.EquipItems', { name: store.name })}
      </button>
    </div>
  );
}

/**
 * Create a Loadout object, used for equipping or creating a new saved loadout
 */
function createLoadout(classType: DimStore['class'], set: ArmorSet): Loadout {
  const loadout = newLoadout(
    t('Loadouts.Generated', { ...set.stats, tier: _.sum(Object.values(set.stats)) }),
    copy({
      helmet: [set.armor[0][0]],
      gauntlets: [set.armor[1][0]],
      chest: [set.armor[2][0]],
      leg: [set.armor[3][0]],
      classitem: [set.armor[4][0]]
    })
  );
  loadout.classType = LoadoutClass[classType];

  _.forIn(loadout.items, (val) => {
    val[0].equipped = true;
  });

  return loadout;
}
