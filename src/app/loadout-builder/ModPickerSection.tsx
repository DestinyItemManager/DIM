import React from 'react';
import { SelectableArmor2Mod } from './locked-armor/SelectableBungieImage';
import styles from './PerksForBucket.m.scss';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { LockedArmor2Mod } from './types';
//import { t } from 'app/i18next-t';

/**
 * A list of seasonal mods for use in PerkPicker.
 */
export default function ModPickerSection({
  defs,
  mods,
  locked,
  title,
  category,
  onModSelected
}: {
  defs: D2ManifestDefinitions;
  mods: readonly LockedArmor2Mod[];
  locked?: readonly LockedArmor2Mod[];
  title: string;
  category: number | string;
  onModSelected(mod: LockedArmor2Mod);
}) {
  return (
    <div className={styles.bucket} id={`mod-picker-section-${category}`}>
      <h3>{title}</h3>
      <div className={styles.perks}>
        {mods.map((item) => (
          <SelectableArmor2Mod
            key={item.mod.hash}
            defs={defs}
            selected={Boolean(locked?.some((p) => p.mod.hash === item.mod.hash))}
            mod={item.mod}
            category={item.category}
            onLockedArmor2Mod={onModSelected}
          />
        ))}
      </div>
    </div>
  );
}
