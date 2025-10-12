import { LookupTable } from 'app/utils/util-types';
import { DestinyAmmunitionType } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import heavy from 'destiny-icons/general/ammo-heavy.svg';
import primary from 'destiny-icons/general/ammo-primary.svg';
import special from 'destiny-icons/general/ammo-special.svg';
import * as styles from './AmmoIcon.m.scss';

const ammoIcons: LookupTable<DestinyAmmunitionType, string> = {
  [DestinyAmmunitionType.Primary]: primary,
  [DestinyAmmunitionType.Special]: special,
  [DestinyAmmunitionType.Heavy]: heavy,
};

export function AmmoIcon({ type, className }: { type: DestinyAmmunitionType; className?: string }) {
  return (
    <img
      className={clsx(
        styles.ammoIcon,
        {
          [styles.primary]: type === DestinyAmmunitionType.Primary,
        },
        className,
      )}
      src={ammoIcons[type]}
    />
  );
}
