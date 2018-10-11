import { t } from 'i18next';
import * as React from 'react';
import * as _ from 'lodash';
import { DimStore } from '../../inventory/store-types';
import { dimLoadoutService, Loadout, LoadoutClass } from '../../loadout/loadout.service';
import { ArmorSet } from '../types';
import { newLoadout } from '../../loadout/loadout-utils';

/**
 * Renders the Create Loadout and Equip Items buttons for each generated set
 */
export default function GeneratedSetButtons({
  store,
  set,
  onLoadoutSet
}: {
  store: DimStore;
  set: ArmorSet;
  onLoadoutSet(loadout: Loadout): void;
}) {
  // Opens the loadout menu for the generated set
  const openLoadout = () => {
    onLoadoutSet(createLoadout(store.class, set));
  };

  // Automatically equip items for this generated set to the active store
  const equipItems = () => {
    const loadout: Loadout = createLoadout(store.class, set);

    _.each(loadout.items, (val) => {
      val[0].equipped = true;
    });

    return dimLoadoutService.applyLoadout(store, loadout, true);
  };

  return (
    <div className="generated-build-buttons">
      <button className="dim-button" onClick={openLoadout}>
        {t('LoadoutBuilder.CreateLoadout')}
      </button>
      <button className="dim-button equip-button" onClick={equipItems}>
        {t('LoadoutBuilder.EquipItems', { name: store.name })}
      </button>
      <span className="light">{set.power / set.armor.length}</span>
    </div>
  );
}

/**
 * Create a Loadout object, used for equipping or creating a new saved loadout
 */
function createLoadout(classType: DimStore['class'], set: ArmorSet): Loadout {
  const loadout = newLoadout(t('Loadouts.AppliedAuto'), {
    helmet: [set.armor[0]],
    gauntlets: [set.armor[1]],
    chest: [set.armor[2]],
    leg: [set.armor[3]],
    classitem: [set.armor[4]]
  });
  loadout.classType = LoadoutClass[classType];
  return loadout;
}
