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
import _ from 'lodash';
import React from 'react';
import styles from './SavedMods.m.scss';

interface Props {
  defs: D1ManifestDefinitions | D2ManifestDefinitions;
  modHashes?: number[];
}

const modOrder = [
  armor2PlugCategoryHashesByName.general,
  armor2PlugCategoryHashesByName.helmet,
  armor2PlugCategoryHashesByName.gauntlets,
  armor2PlugCategoryHashesByName.chest,
  armor2PlugCategoryHashesByName.leg,
  armor2PlugCategoryHashesByName.classitem,
  'other',
] as const;

const modTranslations = {
  [armor2PlugCategoryHashesByName.general]: tl('LB.General'),
  [armor2PlugCategoryHashesByName.helmet]: tl('LB.Helmet'),
  [armor2PlugCategoryHashesByName.gauntlets]: tl('LB.Gauntlets'),
  [armor2PlugCategoryHashesByName.chest]: tl('LB.Chest'),
  [armor2PlugCategoryHashesByName.leg]: tl('LB.Legs'),
  [armor2PlugCategoryHashesByName.classitem]: tl('LB.ClassItem'),
  other: 'Combat',
};

function SavedMods({ defs, modHashes }: Props) {
  if (!modHashes || !defs.isDestiny2()) {
    return null;
  }

  const mods: PluggableInventoryItemDefinition[] = [];

  for (const hash of modHashes) {
    const def = defs.InventoryItem.get(hash);
    if (isPluggableItem(def)) {
      mods.push(def);
    }
  }

  const groupedMods = _.groupBy(mods, (mod) => {
    if (armor2PlugCategoryHashes.includes(mod.plug.plugCategoryHash)) {
      return mod.plug.plugCategoryHash;
    } else {
      return 'other';
    }
  });

  return (
    <div className={styles.container}>
      <div className={styles.title}>{'Mods'}</div>
      <div className={styles.categories}>
        {modOrder.map((key) => (
          <div key={key} className={styles.category}>
            <div className={styles.categoryName}>{t(modTranslations[key])}</div>
            <div className={styles.mods}>
              {groupedMods[key].map((def, index) => (
                <Mod key={index} defs={defs} plugDef={def} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SavedMods;
