import { InGameLoadoutIdentifiers } from '@destinyitemmanager/dim-api-types';
import BungieImage, { bungieBackgroundStyle } from 'app/dim-ui/BungieImage';
import { resolveInGameLoadoutIdentifiers } from 'app/loadout/loadout-type-converters';
import { InGameLoadout } from 'app/loadout/loadout-types';
import { useD2Definitions } from 'app/manifest/selectors';
import clsx from 'clsx';
import styles from './InGameLoadoutIcon.m.scss';

export default function InGameLoadoutIcon({
  loadout,
  className,
  size = 32,
}: {
  loadout: Pick<InGameLoadout, 'colorIcon' | 'icon'>;
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

export function InGameLoadoutIconFromIdentifiers({
  identifiers,
  className,
  size = 32,
}: {
  identifiers: InGameLoadoutIdentifiers;
  className?: string;
  size?: number;
}) {
  const defs = useD2Definitions()!;
  const resolvedIdentifiers = resolveInGameLoadoutIdentifiers(defs, identifiers);
  return <InGameLoadoutIcon loadout={resolvedIdentifiers} className={className} size={size} />;
}
