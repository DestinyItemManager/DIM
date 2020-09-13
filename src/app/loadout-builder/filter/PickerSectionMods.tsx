import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import { MAX_ARMOR_ENERGY_CAPACITY } from 'app/search/d2-known-values';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import React from 'react';
import { SelectableArmor2Mod } from '../locked-armor/SelectableBungieImage';
import { LockedArmor2Mod, ModPickerCategories, ModPickerCategory } from '../types';
import styles from './PickerSection.m.scss';

export default function PickerSectionMods({
  defs,
  mods,
  locked,
  title,
  category,
  maximumSelectable,
  energyMustMatch,
  splitBySeason,
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
  splitBySeason: boolean;
  onModSelected(mod: LockedArmor2Mod);
  onModRemoved(mod: LockedArmor2Mod);
}) {
  if (!mods.length) {
    return null;
  }
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

  const modGroups = splitBySeason
    ? _.groupBy(mods, (mod) => t('LoadoutBuilder.SeasonNum', { season: mod.season }))
    : { nogroup: mods };

  return (
    <div className={styles.bucket} id={`mod-picker-section-${category}`}>
      <div className={styles.header}>{title}</div>
      {Object.entries(modGroups).map(([subTitle, mods]) => (
        <>
          {subTitle !== 'nogroup' && <div className={styles.subheader}>{subTitle}</div>}
          <div className={styles.items}>
            {console.log(mods)}
            {mods.map((item) => (
              <SelectableArmor2Mod
                key={item.mod.hash}
                defs={defs}
                selected={Boolean(
                  locked?.some((lockedItem) => lockedItem.mod.hash === item.mod.hash)
                )}
                mod={item}
                unselectable={isModUnSelectable(item)}
                onModSelected={onModSelected}
                onModRemoved={onModRemoved}
              />
            ))}
          </div>
        </>
      ))}
    </div>
  );
}
