import type { DimBucketType } from 'app/inventory-stores/inventory-buckets';
import { DimItem } from 'app/inventory-stores/item-types';
import legs from 'destiny-icons/armor_types/boots.svg';
import chest from 'destiny-icons/armor_types/chest.svg';
import classItem from 'destiny-icons/armor_types/class.svg';
import gauntlets from 'destiny-icons/armor_types/gloves.svg';
import helmet from 'destiny-icons/armor_types/helmet.svg';
import energyWeapon from 'destiny-icons/general/energy_weapon.svg';
import ghost from 'destiny-icons/general/ghost.svg';
import powerWeapon from 'destiny-icons/general/power_weapon.svg';
import dmgKinetic from 'destiny-icons/weapons/damage_kinetic.svg';
import React from 'react';
import BungieImage from '../BungieImage';

const bucketIcons: { [key in DimBucketType]?: string } = {
  KineticSlot: dmgKinetic,
  Energy: energyWeapon,
  Power: powerWeapon,
  Helmet: helmet,
  Gauntlets: gauntlets,
  Chest: chest,
  Leg: legs,
  ClassItem: classItem,
  Ghost: ghost,
};

export type BucketIconProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  item: DimItem;
};

/** given an item, returns an img. ideally an svg img icon for the item's bucket */
export default function BucketIcon(props: BucketIconProps) {
  const { item, ...otherProps } = props;
  const svg = bucketIcons[item.type];
  return svg ? (
    <img src={svg} {...otherProps} />
  ) : (
    <BungieImage src="/img/misc/missing_icon_d2.png" {...otherProps} />
  );
}
