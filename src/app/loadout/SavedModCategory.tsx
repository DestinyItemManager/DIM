import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import LockedModIcon from 'app/loadout-builder/filter/LockedModIcon';
import React, { useCallback, useState } from 'react';
import { AddButton } from './Buttons';
import styles from './SavedMods.m.scss';

interface Props {
  defs: D2ManifestDefinitions;
  mods: PluggableInventoryItemDefinition[];
  onRemove(itemHash: number): void;
  onOpenModPicker(): void;
}

function getModCounts(mods: PluggableInventoryItemDefinition[]) {
  const counts = {};

  for (const mod of mods) {
    if (counts[mod.hash]) {
      counts[mod.hash]++;
    } else {
      counts[mod.hash] = 1;
    }
  }

  return counts;
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

  const modCounts = getModCounts(mods);

  return (
    <div key={mods[0].plug.plugCategoryHash} className={styles.category}>
      <div className={styles.categoryName} style={{ width }}>
        {mods[0].itemTypeDisplayName}
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
        <AddButton onClick={onOpenModPicker} />
      </div>
    </div>
  );
}

export default SavedModCategory;
