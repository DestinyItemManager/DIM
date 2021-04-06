import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import LockedModIcon from 'app/loadout-builder/filter/LockedModIcon';
import React, { useCallback, useState } from 'react';
import { AddButton } from './Buttons';
import styles from './SavedMods.m.scss';

interface Props {
  defs: D2ManifestDefinitions;
  /** A list of mods that all have the same plugCategoryHash. */
  mods: PluggableInventoryItemDefinition[];
  /** Removes a mod from the loadout via the mods item hash. */
  onRemove(itemHash: number): void;
  /** Opens the mod picker sheet with a supplied query to filter the mods. */
  onOpenModPicker(query?: string): void;
}

/**
 * A component for displaying a group of mods categorised by their plugCategoryHash.
 *
 * It allows the mods to be added to and removed from the loadout.
 */
function SavedModCategory({ defs, mods, onRemove, onOpenModPicker }: Props) {
  const [width, setWidth] = useState<number | undefined>();
  const firstMod = mods.length && mods[0];

  const widthSetter = useCallback(
    (element: HTMLDivElement) => {
      if (element) {
        const elementWidth = element.getBoundingClientRect().width;
        if (elementWidth !== width) {
          setWidth(elementWidth);
        }
      }
    },
    [width, setWidth]
  );

  if (!firstMod) {
    return null;
  }

  // Count the occurences of each mod so we can create unique keys for said mods.
  const modCounts = {};

  for (const mod of mods) {
    if (modCounts[mod.hash]) {
      modCounts[mod.hash]++;
    } else {
      modCounts[mod.hash] = 1;
    }
  }

  return (
    <div key={firstMod.plug.plugCategoryHash} className={styles.category}>
      <div className={styles.categoryName} style={{ width }}>
        {firstMod.itemTypeDisplayName}
      </div>
      <div ref={widthSetter} className={styles.mods}>
        {mods.map((mod) => (
          <LockedModIcon
            key={`${mod.hash}-${modCounts[mod.hash]--}`}
            defs={defs}
            mod={mod}
            onModClicked={() => onRemove(mod.hash)}
          />
        ))}
        <AddButton onClick={() => onOpenModPicker(firstMod.itemTypeDisplayName)} />
      </div>
    </div>
  );
}

export default SavedModCategory;
