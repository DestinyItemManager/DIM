import React from 'react';
import styles from './FractionalPowerLevel.m.scss';

export function FractionalPowerLevel({ power }: { power: number }) {
  const numerator = (power * 8) % 8 || null;
  return (
    <span className={styles.fractionalPowerLevel}>
      {Math.floor(power)}{' '}
      {numerator && (
        <>
          <sup className={styles.subSup}>{numerator}</sup>⁄<sub className={styles.subSup}>8</sub>
        </>
      )}
    </span>
  );
}
