import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { PluggableInventoryItemDefinition } from 'app/inventory/item-types';
import LockedModIcon from 'app/loadout-builder/filter/LockedModIcon';
import React, { useState } from 'react';
import { AddButton } from './Buttons';
import styles from './SavedMods.m.scss';

type ModDefAndIndex = { def: PluggableInventoryItemDefinition; paramIndex: number };

interface Props {
  defs: D2ManifestDefinitions;
  mods: ModDefAndIndex[];
  onRemove(index: number): void;
  onOpenModPicker(): void;
}

function SavedModCategory({ defs, mods, onRemove, onOpenModPicker }: Props) {
  const [width, setWidth] = useState<number | undefined>();

  return (
    <div key={mods[0].def.plug.plugCategoryHash} className={styles.category}>
      <div className={styles.categoryName} style={{ width }}>
        {mods[0].def.itemTypeDisplayName}
      </div>
      <div
        ref={(element) => {
          if (element) {
            const elementWidth = element.getBoundingClientRect().width;
            if (elementWidth !== width) {
              setWidth(elementWidth);
            }
          }
        }}
        className={styles.mods}
      >
        {mods.map((mod) => (
          <LockedModIcon
            key={mod.paramIndex}
            defs={defs}
            mod={mod.def}
            onModClicked={() => onRemove(mod.paramIndex)}
          />
        ))}
        <AddButton onClick={onOpenModPicker} />
      </div>
    </div>
  );
}

export default SavedModCategory;
