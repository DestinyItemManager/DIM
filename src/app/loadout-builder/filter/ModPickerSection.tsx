import React from 'react';
import _ from 'lodash';
import { SelectableArmor2Mod } from '../locked-armor/SelectableBungieImage';
import styles from './PerksForBucket.m.scss';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { LockedArmor2Mod, ModPickerCategory, ModPickerCategories } from '../types';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import { MAX_ARMOR_ENERGY_CAPACITY } from 'app/search/d2-known-values';

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
  const lockedModCost = _.sumBy(locked, (l) => l.mod.plug.energyCost?.energyCost || 0);
  const isNotGeneralOrSeasonal =
    category !== ModPickerCategories.general && category !== ModPickerCategories.seasonal;
  const allLockedAreAnyEnergy = locked?.every(
    (locked) => locked.mod.plug.energyCost!.energyType === DestinyEnergyType.Any
  );

  const isModUnSelectable = (item: LockedArmor2Mod) => {
    const itemEnergyCost = item.mod.plug.energyCost?.energyCost || 0;
    if (
      locked &&
      (locked.length >= maximumSelectable ||
        (isNotGeneralOrSeasonal && lockedModCost + itemEnergyCost > MAX_ARMOR_ENERGY_CAPACITY))
    ) {
      return true;
    }

    if (energyMustMatch) {
      // cases where item is any energy or all mods are any energy
      if (item.mod.plug.energyCost!.energyType === DestinyEnergyType.Any || allLockedAreAnyEnergy) {
        return false;
      }

      if (
        locked?.some(
          (lockedMod) =>
            lockedMod.mod.plug.energyCost!.energyType !== item.mod.plug.energyCost!.energyType
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
            selected={Boolean(locked?.some((lockedItem) => lockedItem.mod.hash === item.mod.hash))}
            mod={item}
            unselectable={isModUnSelectable(item)}
            onModSelected={onModSelected}
            onModRemoved={onModRemoved}
          />
        ))}
      </div>
    </div>
  );
}
