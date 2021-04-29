import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import React, { Dispatch } from 'react';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import { LockedExoticWithPerk } from '../types';
import styles from './ExoticTile.m.scss';

interface Props {
  defs: D2ManifestDefinitions;
  exotic: LockedExoticWithPerk;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
  onClose(): void;
}

/** A square tile container the exotic name, icon, and perk details. */
function ExoticTile({ defs, exotic, lbDispatch, onClose }: Props) {
  let shortPerkDescription = exotic.exoticPerk.displayProperties.description;

  for (const perk of exotic.exoticPerk.perks || []) {
    const description = defs.SandboxPerk.get(perk.perkHash)?.displayProperties.description;
    if (description) {
      shortPerkDescription = description;
      break;
    }
  }

  return (
    <div
      className={styles.exotic}
      onClick={() => {
        lbDispatch({ type: 'lockExotic', lockedExotic: exotic });
        onClose();
      }}
    >
      <div className={styles.itemName}>{exotic.def.displayProperties.name}</div>
      <div className={styles.details}>
        <div className={styles.itemImage}>
          <DefItemIcon itemDef={exotic.def} defs={defs} />
        </div>
        <div className={styles.perkInfo}>
          <div className={styles.perkNameAndImage}>
            <DefItemIcon className={styles.perkImage} itemDef={exotic.exoticPerk} defs={defs} />
            <div className={styles.perkName}>{exotic.exoticPerk.displayProperties.name}</div>
          </div>
          <div className={styles.perkDescription}>{shortPerkDescription}</div>
        </div>
      </div>
    </div>
  );
}

export default ExoticTile;
