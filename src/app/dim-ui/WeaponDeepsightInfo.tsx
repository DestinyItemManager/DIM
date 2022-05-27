import { DimItem } from 'app/inventory/item-types';
import Objective from 'app/progress/Objective';
import React from 'react';
import styles from './WeaponDeepsightInfo.m.scss';

/**
 * A progress bar that shows a weapon's Deepsight Resonance attunement progress.
 */
export function WeaponDeepsightInfo({ item }: { item: DimItem }) {
  const deepsightInfo = item.deepsightInfo;
  const record = item.patternUnlockRecord;

  if (!deepsightInfo && !record?.objectives[0]) {
    return null;
  }

  return (
    <div className={styles.deepsightProgress}>
      {deepsightInfo && <Objective objective={deepsightInfo.attunementObjective} />}
      {record?.objectives.map((objective) => (
        <Objective key={objective.objectiveHash} objective={objective} />
      ))}
    </div>
  );
}
