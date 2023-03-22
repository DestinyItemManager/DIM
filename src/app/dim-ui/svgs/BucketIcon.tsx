import { d2MissingIcon } from 'app/search/d2-known-values';
import clsx from 'clsx';
import { BucketHashes } from 'data/d2/generated-enums';
import legs from 'destiny-icons/armor_types/boots.svg';
import chest from 'destiny-icons/armor_types/chest.svg';
import classItem from 'destiny-icons/armor_types/class.svg';
import gauntlets from 'destiny-icons/armor_types/gloves.svg';
import helmet from 'destiny-icons/armor_types/helmet.svg';
import heavyAmmo from 'destiny-icons/general/ammo-heavy.svg';
import emblem from 'destiny-icons/general/emblem.svg';
import ghost from 'destiny-icons/general/ghost.svg';
import ship from 'destiny-icons/general/ship.svg';
import sparrow from 'destiny-icons/general/sparrow.svg';
import energyWeaponSlot from 'images/weapon-slot-energy.svg';
import kineticWeaponSlot from 'images/weapon-slot-kinetic.svg';
import React from 'react';
import BungieImage from '../BungieImage';
import styles from './BucketIcon.m.scss';

const bucketIcons = {
  [BucketHashes.KineticWeapons]: kineticWeaponSlot,
  [BucketHashes.EnergyWeapons]: energyWeaponSlot,
  [BucketHashes.PowerWeapons]: heavyAmmo,
  [BucketHashes.Helmet]: helmet,
  [BucketHashes.Gauntlets]: gauntlets,
  [BucketHashes.ChestArmor]: chest,
  [BucketHashes.LegArmor]: legs,
  [BucketHashes.ClassArmor]: classItem,
  [BucketHashes.Ghost]: ghost,
  [BucketHashes.Vehicle]: sparrow,
  [BucketHashes.Ships]: ship,
  [BucketHashes.Emblems]: emblem,
};
export const colorizedIcons = [kineticWeaponSlot, energyWeaponSlot, heavyAmmo];

type BucketIconProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  bucketHash: number;
};

/** given an item, returns an img. ideally an svg img icon for the item's bucket */
export default function BucketIcon(props: BucketIconProps) {
  const { bucketHash, ...otherProps } = props;
  const svg = bucketIcons[bucketHash];
  return svg ? (
    <img
      src={svg}
      {...otherProps}
      className={clsx(props.className, {
        [styles.colorized]: colorizedIcons.includes(svg),
        ['colorized']: colorizedIcons.includes(svg),
      })}
    />
  ) : (
    <BungieImage src={d2MissingIcon} {...otherProps} />
  );
}
