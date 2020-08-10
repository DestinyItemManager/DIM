import React from 'react';
import { SelectableMod } from '../locked-armor/SelectableBungieImage';
import styles from './PerksForBucket.m.scss';
import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { LockedModBase } from '../types';
import { t } from 'app/i18next-t';

/**
 * A list of seasonal mods for use in PerkPicker.
 */
export default function SeasonalModPicker({
  defs,
  mods,
  locked,
  onSeasonalModSelected,
}: {
  defs: D2ManifestDefinitions;
  mods: readonly LockedModBase[];
  locked?: readonly LockedModBase[];
  onSeasonalModSelected(mod: LockedModBase): void;
}) {
  return (
    <div className={styles.bucket} id="seasonal">
      <h3>{t('LB.Season')}</h3>
      <div className={styles.perks}>
        {mods.map((item) => (
          <SelectableMod
            key={item.mod.hash}
            defs={defs}
            selected={Boolean(locked?.some((p) => p.mod.hash === item.mod.hash))}
            mod={item.mod}
            plugSetHash={item.plugSetHash}
            onLockedModBase={onSeasonalModSelected}
          />
        ))}
      </div>
    </div>
  );
}
