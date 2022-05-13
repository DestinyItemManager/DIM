import { DimItem } from 'app/inventory/item-types';
import { d2MissingIcon } from 'app/search/d2-known-values';
import { BucketHashes } from 'data/d2/generated-enums';
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

const bucketIcons = {
  [BucketHashes.KineticWeapons]: dmgKinetic,
  [BucketHashes.EnergyWeapons]: energyWeapon,
  [BucketHashes.PowerWeapons]: powerWeapon,
  [BucketHashes.Helmet]: helmet,
  [BucketHashes.Gauntlets]: gauntlets,
  [BucketHashes.ChestArmor]: chest,
  [BucketHashes.LegArmor]: legs,
  [BucketHashes.ClassArmor]: classItem,
  [BucketHashes.Ghost]: ghost,
};

type BucketIconProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  item: DimItem;
};

/** given an item, returns an img. ideally an svg img icon for the item's bucket */
export default function BucketIcon(props: BucketIconProps) {
  const { item, ...otherProps } = props;
  const svg = bucketIcons[item.bucket.hash];
  return svg ? (
    <img src={svg} {...otherProps} />
  ) : (
    <BungieImage src={d2MissingIcon} {...otherProps} />
  );
}
