import BungieImage, { bungieBackgroundStyle } from 'app/dim-ui/BungieImage';
import { InGameLoadout } from 'app/loadout-drawer/loadout-types';
import clsx from 'clsx';
import styles from './InGameLoadoutIcon.m.scss';
export default function InGameLoadoutIcon({
  loadout,
  className,
}: {
  loadout: InGameLoadout;
  className?: string;
}) {
  return (
    <BungieImage
      className={className}
      style={bungieBackgroundStyle(loadout.colorIcon)}
      src={loadout.icon}
      height={32}
      width={32}
    />
  );
}

export function InGameLoadoutIconWithIndex({
  loadout,
  imgClassName,
  className,
}: {
  loadout: InGameLoadout;
  imgClassName?: string;
  className?: string;
}) {
  return (
    <div className={clsx(className, styles.wrapper)}>
      <InGameLoadoutIcon loadout={loadout} className={imgClassName} />
      <div className={styles.index}>{loadout.index + 1}</div>
    </div>
  );
}
