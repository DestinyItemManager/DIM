import { D1ManifestDefinitions } from 'app/destiny1/d1-definitions';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { isPluggableItem } from 'app/inventory/store/sockets';
import Mod from 'app/loadout-builder/generated-sets/Mod';
import React from 'react';
import styles from './SavedMods.m.scss';

interface Props {
  defs: D1ManifestDefinitions | D2ManifestDefinitions;
  modHashes?: number[];
}

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
  return (
    <div className={styles.container}>
      <div>{'Mods'}</div>
      <div className={styles.mods}>
        {mods.map((def, index) => (
          <Mod key={index} defs={defs} plugDef={def} />
        ))}
      </div>
    </div>
  );
}

export default SavedMods;
