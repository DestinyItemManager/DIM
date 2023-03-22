import { d2MissingIcon } from 'app/search/d2-known-values';
import clsx from 'clsx';
import { BucketHashes, ItemCategoryHashes } from 'data/d2/generated-enums';
import React from 'react';
import BungieImage from '../BungieImage';
import styles from './BucketIcon.m.scss';
import { colorizedIcons, itemCategoryIcons } from './itemCategory';

const bucketHashToItemCategoryHash = {
  [BucketHashes.KineticWeapons]: ItemCategoryHashes.KineticWeapon,
  [BucketHashes.EnergyWeapons]: ItemCategoryHashes.EnergyWeapon,
  [BucketHashes.PowerWeapons]: ItemCategoryHashes.PowerWeapon,
  [BucketHashes.Helmet]: ItemCategoryHashes.Helmets,
  [BucketHashes.Gauntlets]: ItemCategoryHashes.Arms,
  [BucketHashes.ChestArmor]: ItemCategoryHashes.Chest,
  [BucketHashes.LegArmor]: ItemCategoryHashes.Legs,
  [BucketHashes.ClassArmor]: ItemCategoryHashes.ClassItems,
  [BucketHashes.Ghost]: ItemCategoryHashes.Ghost,
  [BucketHashes.Vehicle]: ItemCategoryHashes.Sparrows,
  [BucketHashes.Ships]: ItemCategoryHashes.Ships,
  [BucketHashes.Emblems]: ItemCategoryHashes.Emblems,
} as const;

type BucketIconProps = React.ImgHTMLAttributes<HTMLImageElement> &
  (
    | {
        bucketHash: number;
      }
    | {
        itemCategoryHash: number;
      }
  );

function resolveIcon(props: BucketIconProps) {
  if ('bucketHash' in props) {
    const { bucketHash, ...otherProps } = props;
    return {
      svg: itemCategoryIcons[bucketHashToItemCategoryHash[bucketHash]],
      otherProps,
    };
  } else {
    const { itemCategoryHash, ...otherProps } = props;
    return {
      svg: itemCategoryIcons[itemCategoryHash],
      otherProps,
    };
  }
}

/** given an item, returns an img. ideally an svg img icon for the item's bucket */
export default function BucketIcon(props: BucketIconProps) {
  const icon = resolveIcon(props);
  return icon.svg ? (
    <img
      src={icon.svg}
      {...icon.otherProps}
      className={clsx(props.className, styles.icon, {
        [styles.colorized]: colorizedIcons.includes(icon.svg),
        ['colorized']: colorizedIcons.includes(icon.svg),
      })}
    />
  ) : (
    <BungieImage src={d2MissingIcon} {...icon.otherProps} />
  );
}
