import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import LockedModIcon from 'app/loadout-builder/filter/LockedModIcon';
import { LockedMod } from 'app/loadout-builder/types';
import React, { useState } from 'react';
import { AddButton } from './Buttons';
import styles from './SavedMods.m.scss';

interface Props {
  defs: D2ManifestDefinitions;
  mods: LockedMod[];
  onRemove(index: number): void;
  onOpenModPicker(): void;
}

function SavedModCategory({ defs, mods, onRemove, onOpenModPicker }: Props) {
  const [width, setWidth] = useState<number | undefined>();

  return (
    <div key={mods[0].modDef.plug.plugCategoryHash} className={styles.category}>
      <div className={styles.categoryName} style={{ width }}>
        {mods[0].modDef.itemTypeDisplayName}
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
            key={mod.key}
            defs={defs}
            mod={mod.modDef}
            onModClicked={() => onRemove(mod.key)}
          />
        ))}
        <AddButton onClick={onOpenModPicker} />
      </div>
    </div>
  );
}

export default SavedModCategory;
