import React from 'react';
import { SelectableMod } from './locked-armor/SelectableBungieImage';
import styles from './PerksForBucket.m.scss';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { LockedModBase } from './types';

/**
 * A list of selectable perks for a bucket (chest, helmet, etc) for use in PerkPicker.
 */
export default function SeasonalModPicker({
  defs,
  mods,
  locked,
  onSeasonalModSelected
}: {
  defs: D2ManifestDefinitions;
  mods: readonly LockedModBase[];
  locked?: readonly LockedModBase[];
  onSeasonalModSelected(mod: LockedModBase);
}) {
  return (
    <div className={styles.bucket} id="seasonal">
      <h3>Seasonal</h3>
      <div className={styles.perks}>
        {mods.map((mod) => (
          <SelectableMod
            key={mod.item.hash}
            defs={defs}
            selected={Boolean(locked?.some((p) => p.item.hash === mod.item.hash))}
            mod={mod.item}
            plugSetHash={mod.plugSetHash}
            onLockedModBase={onSeasonalModSelected}
          />
        ))}
      </div>
    </div>
  );
}
