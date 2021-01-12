import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { MAX_ARMOR_ENERGY_CAPACITY } from 'app/search/d2-known-values';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import React from 'react';
import { SelectableArmor2Mod } from '../locked-armor/SelectableBungieImage';
import {
  knownModPlugCategoryHashes,
  LockedArmor2Mod,
  raidPlugCategoryHashes,
  slotSpecificPlugCategoryHashes,
} from '../types';
import styles from './PickerSection.m.scss';

/** Slot specific mods can have at most 2 mods. */
const MAX_SLOT_SPECIFIC_MODS = 2;
/** Raid, combat and legacy mods can have up to 5 selected. */
const MAX_SLOT_INDEPENDENT_MODS = 5;

export default function PickerSectionMods({
  defs,
  mods,
  locked,
  title,
  plugCategoryHashes,
  onModSelected,
  onModRemoved,
}: {
  defs: D2ManifestDefinitions;
  mods: readonly LockedArmor2Mod[];
  locked: readonly LockedArmor2Mod[];
  title: string;
  plugCategoryHashes: number[];
  onModSelected(mod: LockedArmor2Mod);
  onModRemoved(mod: LockedArmor2Mod);
}) {
  if (!mods.length) {
    return null;
  }
  const lockedModCost = _.sumBy(locked, (l) => l.modDef.plug.energyCost?.energyCost || 0);
  const isSlotSpecificCategory = Boolean(
    _.intersection(slotSpecificPlugCategoryHashes, plugCategoryHashes).length
  );

  // Has a raid mod plug category hash or no known hashes, this case is combat and legacy.
  const splitByItemTypeDisplayName = Boolean(
    _.intersection(raidPlugCategoryHashes, plugCategoryHashes).length ||
      !_.intersection(knownModPlugCategoryHashes, plugCategoryHashes).length
  );

  /**
   * Figures out whether you should be able to select a mod. Different rules apply for slot specific
   * mods to raid/combat/legacy.
   */
  const isModSelectable = (mod: LockedArmor2Mod) => {
    if (isSlotSpecificCategory) {
      // Traction has no energy type so its basically Any energy and 0 cost
      const modCost = mod.modDef.plug.energyCost?.energyCost || 0;
      const modEnergyType = mod.modDef.plug.energyCost?.energyType || DestinyEnergyType.Any;

      return (
        locked.length < MAX_SLOT_SPECIFIC_MODS &&
        lockedModCost + modCost <= MAX_ARMOR_ENERGY_CAPACITY &&
        (modEnergyType === DestinyEnergyType.Any || // Any energy works with everything
          locked.some((l) => l.modDef.plug.energyCost?.energyType === modEnergyType) || // Matches some other enery
          locked.every(
            (l) =>
              (l.modDef.plug.energyCost?.energyType || DestinyEnergyType.Any) ===
              DestinyEnergyType.Any
          )) // If every thing else is Any we are good
      );
    } else {
      return locked.length < MAX_SLOT_INDEPENDENT_MODS;
    }
  };

  const modGroups = splitByItemTypeDisplayName
    ? _.groupBy(mods, (mod) => mod.modDef.itemTypeDisplayName)
    : { nogroup: mods };

  return (
    <div className={styles.bucket} id={`mod-picker-section-${plugCategoryHashes.join('-')}`}>
      <div className={styles.header}>{title}</div>
      {Object.entries(modGroups).map(([subTitle, mods]) => (
        <div key={subTitle}>
          {subTitle !== 'nogroup' && <div className={styles.subheader}>{subTitle}</div>}
          <div className={styles.items}>
            {mods.map((item) => (
              <SelectableArmor2Mod
                key={item.modDef.hash}
                defs={defs}
                selected={Boolean(
                  locked.some((lockedItem) => lockedItem.modDef.hash === item.modDef.hash)
                )}
                mod={item}
                selectable={isModSelectable(item)}
                onModSelected={onModSelected}
                onModRemoved={onModRemoved}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
