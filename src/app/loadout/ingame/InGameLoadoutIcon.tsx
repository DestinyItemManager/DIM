import BungieImage, { bungieBackgroundStyle } from 'app/dim-ui/BungieImage';
import { InGameLoadout } from 'app/loadout-drawer/loadout-types';
import { clsx } from 'clsx';
import styles from './InGameLoadoutIcon.m.scss';

export default function InGameLoadoutIcon({
  loadout,
  className,
  size = 32,
}: {
  loadout: InGameLoadout;
  className?: string;
  size?: number;
}) {
  return (
    <BungieImage
      className={clsx(styles.iconImg, className)}
      style={bungieBackgroundStyle(loadout.colorIcon)}
      src={loadout.icon}
      height={size}
      width={size}
    />
  );
}

export function InGameLoadoutIconWithIndex({
  loadout,
  imgClassName,
  className,
  size = 32,
}: {
  loadout: InGameLoadout;
  imgClassName?: string;
  className?: string;
  size?: number;
}) {
  return (
    <div className={clsx(className, styles.wrapper)} style={{ fontSize: `${size}px` }}>
      <InGameLoadoutIcon loadout={loadout} className={imgClassName} size={size} />
      <div className={styles.index}>{loadout.index + 1}</div>
    </div>
  );
}
