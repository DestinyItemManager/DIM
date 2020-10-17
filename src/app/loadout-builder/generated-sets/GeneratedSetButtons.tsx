import { t } from 'app/i18next-t';
import { applyLoadout } from 'app/loadout/loadout-apply';
import { Loadout } from 'app/loadout/loadout-types';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import React from 'react';
import { useDispatch } from 'react-redux';
import { DimStore } from '../../inventory/store-types';
import { convertToLoadoutItem, newLoadout } from '../../loadout/loadout-utils';
import { ArmorSet } from '../types';
import { statTier } from '../utils';
import styles from './GeneratedSetButtons.m.scss';

/**
 * Renders the Create Loadout and Equip Items buttons for each generated set
 */
export default function GeneratedSetButtons({
  store,
  set,
  canCompareLoadouts,
  onLoadoutSet,
  onCompareSet,
}: {
  store: DimStore;
  set: ArmorSet;
  canCompareLoadouts: boolean;
  onLoadoutSet(loadout: Loadout): void;
  onCompareSet(): void;
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

  return (
    <div className={styles.buttons}>
      <button type="button" className="dim-button" onClick={openLoadout}>
        {t('LoadoutBuilder.CreateLoadout')}
      </button>
      {canCompareLoadouts && (
        <button type="button" className="dim-button" onClick={onCompareSet}>
          {t('LoadoutBuilder.CompareLoadout')}
        </button>
      )}
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
