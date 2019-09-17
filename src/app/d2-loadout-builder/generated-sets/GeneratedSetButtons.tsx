import { t } from 'app/i18next-t';
import _ from 'lodash';
import React from 'react';
import { DimStore } from '../../inventory/store-types';
import { newLoadout } from '../../loadout/loadout-utils';
import { dimLoadoutService, Loadout, LoadoutClass } from '../../loadout/loadout.service';
import { ArmorSet } from '../types';
import styles from './GeneratedSetButtons.m.scss';
import copy from 'fast-copy';

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
    <div className={styles.buttons}>
      <span className={styles.combos}>{t('LoadoutBuilder.Combinations', { count: numSets })}</span>
      <button className="dim-button" onClick={openLoadout}>
        {t('LoadoutBuilder.CreateLoadout')}
      </button>
      <button className="dim-button" onClick={equipItems}>
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
    // TODO: Move ...set.stats out of t() in breaks i18next-scanner
    t('Loadouts.Generated', { ...set.stats, tier: _.sum(Object.values(set.stats)) }),
    _.zipObject(
      ['helmet', 'gauntlets', 'chest', 'leg', 'classitem', 'ghost'],
      set.firstValidSet.map((i) => [copy(i)])
    )
  );
  loadout.classType = LoadoutClass[classType];

  _.forIn(loadout.items, (val) => {
    val[0].equipped = true;
  });

  return loadout;
}
