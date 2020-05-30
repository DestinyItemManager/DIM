import React from 'react';
import { SelectableArmor2Mod } from './locked-armor/SelectableBungieImage';
import styles from './PerksForBucket.m.scss';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { LockedArmor2Mod, ModPickerCategory } from './types';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import ClosableContainer from './ClosableContainer';

export default function ModPickerSection({
  defs,
  mods,
  locked,
  title,
  category,
  maximumSelectable,
  energyMustMatch,
  onModSelected,
  onModRemoved,
}: {
  defs: D2ManifestDefinitions;
  mods: readonly LockedArmor2Mod[];
  locked?: readonly LockedArmor2Mod[];
  title: string;
  category: ModPickerCategory;
  maximumSelectable: number;
  energyMustMatch?: boolean;
  onModSelected(mod: LockedArmor2Mod);
  onModRemoved(mod: LockedArmor2Mod);
}) {
  const isModUnSelectable = (item: LockedArmor2Mod) => {
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
          <ClosableContainer key={item.key} onClose={() => onModRemoved(item)}>
            <SelectableArmor2Mod
              defs={defs}
              selected={Boolean(locked?.some((p) => p.mod.hash === item.mod.hash))}
              mod={item}
              unselectable={isModUnSelectable(item)}
              onLockedArmor2Mod={onModSelected}
            />
          </ClosableContainer>
        ))}
      </div>
    </div>
  );
}
