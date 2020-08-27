import { t } from 'app/i18next-t';
import _ from 'lodash';
import React from 'react';
import { DimStore } from '../../inventory/store-types';
import { newLoadout, convertToLoadoutItem } from '../../loadout/loadout-utils';
import { ArmorSet } from '../types';
import styles from './GeneratedSetButtons.m.scss';
import { Loadout } from 'app/loadout/loadout-types';
import { applyLoadout } from 'app/loadout/loadout-apply';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { statTier } from '../utils';

/**
 * Renders the Create Loadout and Equip Items buttons for each generated set
 */
export default function GeneratedSetButtons({
  store,
  set,
  onLoadoutSet,
}: {
  store: DimStore;
  set: ArmorSet;
  onLoadoutSet(loadout: Loadout): void;
}) {
  // Opens the loadout menu for the generated set
  const openLoadout = () => {
    onLoadoutSet(createLoadout(store.classType, set));
  };

  // Automatically equip items for this generated set to the active store
  const equipItems = () => {
    const loadout = createLoadout(store.classType, set);
    return applyLoadout(store, loadout, true);
  };

  return (
    <div className={styles.buttons}>
      <button type="button" className="dim-button" onClick={openLoadout}>
        {t('LoadoutBuilder.CreateLoadout')}
      </button>
      <button type="button" className="dim-button" onClick={equipItems}>
        {t('LoadoutBuilder.EquipItems', { name: store.name })}
      </button>
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
