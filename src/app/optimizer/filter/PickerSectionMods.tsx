import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import {
  armor2PlugCategoryHashesByName,
  MAX_ARMOR_ENERGY_CAPACITY,
} from 'app/search/d2-known-values';
import { DestinyEnergyType } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import React from 'react';
import {
  knownModPlugCategoryHashes,
  raidPlugCategoryHashes,
  slotSpecificPlugCategoryHashes,
} from '../types';
import styles from './PickerSection.m.scss';
import { SelectableMod } from './SelectableBungieImage';

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
  mods: readonly PluggableInventoryItemDefinition[];
  locked: { [plugCategoryHash: number]: PluggableInventoryItemDefinition[] | undefined };
  title: string;
  plugCategoryHashes: number[];
  onModSelected(mod: PluggableInventoryItemDefinition);
  onModRemoved(mod: PluggableInventoryItemDefinition);
}) {
  if (!mods.length) {
    return null;
  }

  const isSlotSpecificCategory = Boolean(
    _.intersection(slotSpecificPlugCategoryHashes, plugCategoryHashes).length
  );

  let associatedLockedMods: PluggableInventoryItemDefinition[] = [];

  if (
    isSlotSpecificCategory ||
    plugCategoryHashes.includes(armor2PlugCategoryHashesByName.general)
  ) {
    associatedLockedMods = plugCategoryHashes.flatMap((hash) => locked[hash] || []);
  } else if (_.intersection(raidPlugCategoryHashes, plugCategoryHashes).length) {
    associatedLockedMods = raidPlugCategoryHashes.flatMap((hash) => locked[hash] || []);
  } else {
    associatedLockedMods = Object.entries(locked).flatMap(([plugCategoryHash, mods]) =>
      mods && !knownModPlugCategoryHashes.includes(Number(plugCategoryHash)) ? mods : []
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
            defs={defs}
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
