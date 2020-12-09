import BungieImage, { BungieImageProps } from 'app/dim-ui/BungieImage';
import clsx from 'clsx';
import React from 'react';
import styles from './BungieImageAndAmmo.m.scss';

type BungieImageAndAmmoProps = BungieImageProps & {
  hash: number;
};

/**
 * A display for perk images that knows about certain items that have
 * corresponding ammo types.
 */
export default function BungieImageAndAmmo(props: BungieImageAndAmmoProps) {
  const { hash, className, ...otherProps } = props;

  let ammoImage;
  switch (hash) {
    case 143442373:
      ammoImage = styles.ammoPrimary;
      break;
    case 2620835322:
      ammoImage = styles.ammoSpecial;
      break;
    case 2867719094:
      ammoImage = styles.ammoHeavy;
      break;
  }

  return (
    <div className={clsx(className, styles.container)}>
      <BungieImage {...otherProps} />
      {ammoImage && <div className={`${styles.ammo} ${ammoImage}`} />}
    </div>
  );
}
