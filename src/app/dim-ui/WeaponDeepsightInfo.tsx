import { DimDeepsight } from 'app/inventory/item-types';
import Objective from 'app/progress/Objective';
import React from 'react';
import styles from './WeaponDeepsightInfo.m.scss';

/**
 * A progress bar that shows a weapon's Deepsight Resonance attunement progress.
 */
export function WeaponDeepsightInfo({ deepsightInfo }: { deepsightInfo: DimDeepsight }) {
  return (
    <div className={styles.deepsightProgress}>
      <Objective objective={deepsightInfo.attunementObjective} />
    </div>
  );
}
