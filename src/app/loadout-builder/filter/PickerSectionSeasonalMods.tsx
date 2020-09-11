import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { t } from 'app/i18next-t';
import React from 'react';
import { SelectableMod } from '../locked-armor/SelectableBungieImage';
import { LockedModBase } from '../types';
import styles from './PickerSection.m.scss';

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
      <div className={styles.header}>{t('LB.Season')}</div>
      <div className={styles.items}>
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
