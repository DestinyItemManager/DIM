import React from 'react';
import { AppIcon, banIcon, tagIcon } from 'app/shell/icons';
import styles from './ValueDial.m.scss';

/** expects a value from 1-100 but caps both ends */
export default function ValueDial({ value }: { value: number }) {
  value = Math.min(100, Math.max(0, value));
  const direction = ((1.5 * value - 75) * Math.PI) / 180;
  const colors = getValueColors(value);
  const x = Math.sin(direction) * 0.9;
  const y = Math.cos(direction) * 0.9;
  // #0804 #0b0 125
  return (
    <svg height="12" viewBox="0 0 2 1">
      <circle r={1} cx={1} cy={1} fill={colors[0]} />
      <line
        x1="1"
        y1="1"
        x2={1 + x}
        y2={1 - y}
        stroke={colors[1]}
        strokeWidth="0.15"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** returns [dark, light] variations along a 1->100  red->yellow->green line */
export function getValueColors(value: number) {
  const hue = value * 1.25;
  const light = Math.floor(-(value ** 2 / 250) + (2 * value) / 5 + 30);
  return [`hsl(${hue}, 100%, 8%)`, `hsl(${hue}, 100%, ${light}%)`];
}

export function KeepJunkDial({ value }: { value: number }) {
  const rawRatio = Math.floor((value / 100) * 100) / 100;
  return (
    <>
      <span style={{ opacity: 1 - rawRatio }}>
        <AppIcon icon={banIcon} className={`${styles.junkIcon} ${styles.tagIcon}`} />
      </span>
      <ValueDial value={value} />
      <span style={{ opacity: rawRatio }}>
        <AppIcon icon={tagIcon} className={`${styles.keepIcon} ${styles.tagIcon}`} />
      </span>
    </>
  );
}
