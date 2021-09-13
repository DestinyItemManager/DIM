import React from 'react';
import styles from './DiamondProgress.m.scss';

interface Props {
  /** 0-1 progress for the outer ring */
  progress: number;
  /** Level to display */
  level?: number;
  /** The icon to use */
  icon: string;
  /** The small transparent icon overlay for ritual vendors */
  icon2?: string;
  className?: string;
}

/**
 * A circle-shaped progress bar (from faction icons).
 */
export default function CircleProgress({ progress, level, icon, icon2, className }: Props) {
  const style = {
    strokeDashoffset: 121.622368 - 121.622368 * progress,
  };

  return (
    <div className={className}>
      <svg viewBox="0 0 48 48">
        <image xlinkHref={icon} width="48" height="48" />
        <image xlinkHref={icon2} x="6" y="6" width="36" height="36" />
        {progress > 0 && (
          <circle
            strokeDasharray="121.622368"
            style={style}
            fillOpacity="0"
            stroke="#FFF"
            strokeWidth="3"
            cx="24"
            cy="24"
            r="21"
            strokeLinecap="butt"
            transform="rotate(-90 24 24)"
          />
        )}
      </svg>
      {level !== undefined && <div className={styles.level}>{level}</div>}
    </div>
  );
}
