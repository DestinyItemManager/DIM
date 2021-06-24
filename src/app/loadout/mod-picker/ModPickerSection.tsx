import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import {
  armor2PlugCategoryHashesByName,
  MAX_ARMOR_ENERGY_CAPACITY,
} from 'app/search/d2-known-values';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import raidModPlugCategoryHashes from 'data/d2/raid-mod-plug-category-hashes.json';
import _ from 'lodash';
import React from 'react';
import { knownModPlugCategoryHashes, slotSpecificPlugCategoryHashes } from '../known-values';
import styles from './ModPickerSection.m.scss';
import SelectableMod from './SelectableMod';

/** Slot specific mods can have at most 2 mods. */
const MAX_SLOT_SPECIFIC_MODS = 2;
/** Raid, combat and legacy mods can have up to 5 selected. */
const MAX_SLOT_INDEPENDENT_MODS = 5;

export default function PickerSectionMods({
  mods,
  lockedModsInternal,
  onModSelected,
  onModRemoved,
}: {
  /** A array of mods where plug.plugCategoryHash's are equal. */
  mods: readonly PluggableInventoryItemDefinition[];
  /** The current set of selected mods. Needed to figure out selection limits for some plugCategoryHashes. */
  lockedModsInternal: PluggableInventoryItemDefinition[];
  onModSelected(mod: PluggableInventoryItemDefinition): void;
  onModRemoved(mod: PluggableInventoryItemDefinition): void;
}) {
  if (!mods.length) {
    return null;
  }

  const { plugCategoryHash } = mods[0].plug;
  const title = mods[0].itemTypeDisplayName;

  const isSlotSpecificCategory = slotSpecificPlugCategoryHashes.includes(plugCategoryHash);

  let associatedLockedMods: PluggableInventoryItemDefinition[] = [];

  if (isSlotSpecificCategory || plugCategoryHash === armor2PlugCategoryHashesByName.general) {
    associatedLockedMods = lockedModsInternal.filter(
      (mod) => mod.plug.plugCategoryHash === plugCategoryHash
    );
  } else if (raidModPlugCategoryHashes.includes(plugCategoryHash)) {
    associatedLockedMods = lockedModsInternal.filter((mod) =>
      raidModPlugCategoryHashes.includes(mod.plug.plugCategoryHash)
    );
  } else {
    associatedLockedMods = lockedModsInternal.filter(
      (mod) => !knownModPlugCategoryHashes.includes(mod.plug.plugCategoryHash)
    );
  }

  // We only care about this for slot specific mods and it is used in isModSelectable. It is calculated here
  // so it is only done once per render.
  const lockedModCost = isSlotSpecificCategory
    ? _.sumBy(associatedLockedMods, (mod) => mod.plug.energyCost?.energyCost || 0)
    : 0;

  /**
   * Figures out whether you should be able to select a mod. Different rules apply for slot specific
   * mods to raid/combat/legacy.
   */
  const isModSelectable = (mod: PluggableInventoryItemDefinition) => {
    if (isSlotSpecificCategory) {
      // Traction has no energy type so its basically Any energy and 0 cost
      const modCost = mod.plug.energyCost?.energyCost || 0;
      const modEnergyType = mod.plug.energyCost?.energyType || DestinyEnergyType.Any;

      return (
        associatedLockedMods.length < MAX_SLOT_SPECIFIC_MODS &&
        lockedModCost + modCost <= MAX_ARMOR_ENERGY_CAPACITY &&
        (modEnergyType === DestinyEnergyType.Any || // Any energy works with everything
          associatedLockedMods.some((l) => l.plug.energyCost?.energyType === modEnergyType) || // Matches some other enery
          associatedLockedMods.every(
            (l) =>
              (l.plug.energyCost?.energyType || DestinyEnergyType.Any) === DestinyEnergyType.Any
          )) // If every thing else is Any we are good
      );
    } else {
      return associatedLockedMods.length < MAX_SLOT_INDEPENDENT_MODS;
    }
  };

  return (
    <div className={styles.bucket}>
      <div className={styles.header}>{title}</div>
      <div className={styles.items}>
        {mods.map((item) => (
          <SelectableMod
            key={item.hash}
            selected={Boolean(
              associatedLockedMods.some((lockedItem) => lockedItem.hash === item.hash)
            )}
            mod={item}
            selectable={isModSelectable(item)}
            onModSelected={onModSelected}
            onModRemoved={onModRemoved}
          />
        ))}
      </div>
    </div>
  );
}
