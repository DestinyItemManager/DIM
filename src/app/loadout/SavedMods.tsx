import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t, tl } from 'app/i18next-t';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { isPluggableItem } from 'app/inventory/store/sockets';
import Mod from 'app/loadout-builder/generated-sets/Mod';
import {
  armor2PlugCategoryHashes,
  armor2PlugCategoryHashesByName,
} from 'app/search/d2-known-values';
import { chainComparator, compareBy } from 'app/utils/comparators';
import _ from 'lodash';
import React, { useMemo } from 'react';
import styles from './SavedMods.m.scss';

interface Props {
  defs: D1ManifestDefinitions | D2ManifestDefinitions;
  modHashes?: number[];
}

const modCategoryOrder = [
  armor2PlugCategoryHashesByName.general,
  armor2PlugCategoryHashesByName.helmet,
  armor2PlugCategoryHashesByName.gauntlets,
  armor2PlugCategoryHashesByName.chest,
  armor2PlugCategoryHashesByName.leg,
  armor2PlugCategoryHashesByName.classitem,
  'combat',
] as const;

const modCategoryTranslations = {
  [armor2PlugCategoryHashesByName.general]: tl('LB.General'),
  [armor2PlugCategoryHashesByName.helmet]: tl('LB.Helmet'),
  [armor2PlugCategoryHashesByName.gauntlets]: tl('LB.Gauntlets'),
  [armor2PlugCategoryHashesByName.chest]: tl('LB.Chest'),
  [armor2PlugCategoryHashesByName.leg]: tl('LB.Legs'),
  [armor2PlugCategoryHashesByName.classitem]: tl('LB.ClassItem'),
  combat: tl('LB.Combat'),
};

const sortMods = chainComparator<PluggableInventoryItemDefinition>(
  compareBy((def) => def.plug.energyCost?.energyType),
  compareBy((def) => def.plug.energyCost?.energyCost),
  compareBy((def) => def.displayProperties.name)
);

/**
 * Component for managing mods associated to a loadout.
 */
function SavedMods({ defs, modHashes }: Props) {
  const groupedMods = useMemo(() => {
    const mods: PluggableInventoryItemDefinition[] = [];

    if (!modHashes?.length) {
      return {};
    }

    for (const hash of modHashes) {
      const def = defs.InventoryItem.get(hash);
      if (isPluggableItem(def)) {
        mods.push(def);
      }
    }

    mods.sort(sortMods);

    return _.groupBy(mods, (mod) => {
      if (armor2PlugCategoryHashes.includes(mod.plug.plugCategoryHash)) {
        return mod.plug.plugCategoryHash;
      } else {
        // TODO This is a placeholder for now until we know how to differentiate
        // between the new mod categories in beyond light
        return 'combat';
      }
    });
  }, [modHashes, defs]);

  if (!defs.isDestiny2() || !groupedMods.length) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.title}>{t('Loadouts.Mods')}</div>
      <div className={styles.categories}>
        {modCategoryOrder.map(
          (key) =>
            groupedMods[key] && (
              <div key={key} className={styles.category}>
                <div className={styles.categoryName}>{t(modCategoryTranslations[key])}</div>
                <div className={styles.mods}>
                  {groupedMods[key].map((def, index) => (
                    <Mod key={index} defs={defs} plugDef={def} />
                  ))}
                </div>
              </div>
            )
        )}
      </div>
    </div>
  );
}

export default SavedMods;
