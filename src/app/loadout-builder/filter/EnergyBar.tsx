import 'app/dim-ui/EnergyMeterIncrements.scss';
import clsx from 'clsx';
import React, { ReactNode } from 'react';
import styles from './EnergyBar.m.scss';

export default function EnergyBar({
  title,
  assumedEnergy = 1,
  onSegmentClick,
}: {
  title: string;
  assumedEnergy?: number;
  onSegmentClick(value: number): void;
}) {
  const segments: ReactNode[] = [];
  for (let i = 1; i <= 10; i++) {
    segments.push(
      <div
        className={assumedEnergy >= i ? clsx('used', styles.used) : clsx('unused', styles.unused)}
        onClick={() => onSegmentClick(i)}
      />
    );
  }

  return (
    <div className={styles.energySelect}>
      <div className={styles.title}>{title}</div>
      <div className={clsx('energyMeterIncrements', 'medium')}>{segments}</div>
    </div>
  );
}
