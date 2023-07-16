import styles from './DiamondProgress.m.scss';

interface Props {
  /** 0-1 progress for the outer ring */
  progress: number;
  /** Level to display */
  level?: number;
  /** The icon to use */
  icon: string;
  className?: string;
}

/**
 * A diamond-shaped progress bar (from faction icons).
 */
export default function DiamondProgress({ progress, level, icon, className }: Props) {
  const style = {
    strokeDashoffset: 121.622368 - 121.622368 * progress,
  };

  return (
    <div className={className}>
      <svg viewBox="0 0 48 48">
        <image xlinkHref={icon} width="48" height="48" />
        {progress > 0 && (
          <polygon
            strokeDasharray="121.622368"
            style={style}
            fillOpacity="0"
            stroke="#FFF"
            strokeWidth="3"
            points="24,2.5 45.5,24 24,45.5 2.5,24"
            strokeLinecap="butt"
          />
        )}
      </svg>
      {level !== undefined && <div className={styles.level}>{level}</div>}
    </div>
  );
}
