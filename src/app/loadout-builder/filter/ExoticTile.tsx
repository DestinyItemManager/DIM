import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import { DefItemIcon } from 'app/inventory/ItemIcon';
import React, { Dispatch } from 'react';
import { LoadoutBuilderAction } from '../loadout-builder-reducer';
import { LockedExotic } from '../types';
import styles from './ExoticTile.m.scss';

export interface LockedExoticWithPerk extends LockedExotic {
  exoticPerk: PluggableInventoryItemDefinition;
  shortPerkDescription?: string;
}

interface Props {
  defs: D2ManifestDefinitions;
  exotic: LockedExoticWithPerk;
  lbDispatch: Dispatch<LoadoutBuilderAction>;
  onClose(): void;
}

function ExoticTile({ defs, exotic, lbDispatch, onClose }: Props) {
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
          <div className={styles.perkDescription}>{exotic.shortPerkDescription}</div>
        </div>
      </div>
    </div>
  );
}

export default ExoticTile;
