import React from 'react';
import { SelectableArmor2Mod } from './locked-armor/SelectableBungieImage';
import styles from './PerksForBucket.m.scss';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { LockedArmor2Mod, ModPickerCategory } from './types';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';

export default function ModPickerSection({
  defs,
  mods,
  locked,
  title,
  category,
  maximumSelectable,
  energyMustMatch,
  onModSelected
}: {
  defs: D2ManifestDefinitions;
  mods: readonly LockedArmor2Mod[];
  locked?: readonly LockedArmor2Mod[];
  title: string;
  category: ModPickerCategory;
  maximumSelectable: number;
  energyMustMatch?: boolean;
  onModSelected(mod: LockedArmor2Mod);
}) {
  const isModUnSelectable = (item: LockedArmor2Mod) => {
    // if it is selected you can unselect it
    if (locked?.some((p) => p.mod.hash === item.mod.hash)) {
      return false;
    }

    if (locked && locked.length >= maximumSelectable) {
      return true;
    }

    if (energyMustMatch) {
      // cases where item is any energy or all mods are any energy
      if (
        item.mod.plug.energyCost.energyType === DestinyEnergyType.Any ||
        locked?.every((locked) => locked.mod.plug.energyCost.energyType === DestinyEnergyType.Any)
      ) {
        return false;
      }

      if (
        locked?.some(
          (lockedMod) =>
            lockedMod.mod.plug.energyCost.energyType !== item.mod.plug.energyCost.energyType
        )
      ) {
        return true;
      }
    }

    return false;
  };

  return (
    <div className={styles.bucket} id={`mod-picker-section-${category}`}>
      <h3>{title}</h3>
      <div className={styles.perks}>
        {mods.map((item) => (
          <SelectableArmor2Mod
            key={item.mod.hash}
            defs={defs}
            selected={Boolean(locked?.some((p) => p.mod.hash === item.mod.hash))}
            mod={item.mod}
            category={item.category}
            unselectable={isModUnSelectable(item)}
            onLockedArmor2Mod={onModSelected}
          />
        ))}
      </div>
    </div>
  );
}
