import { d2MissingIcon } from 'app/search/d2-known-values';
import clsx from 'clsx';
import React from 'react';
import BungieImage from '../BungieImage';
import styles from './BucketIcon.m.scss';
import { getBucketSvgIcon, ItemCategoryIcon, itemCategoryIcons } from './itemCategory';

type BucketIconProps = React.ImgHTMLAttributes<HTMLImageElement> &
  (
    | {
        icon: ItemCategoryIcon;
      }
    | {
        bucketHash: number;
      }
    | {
        itemCategoryHash: number;
      }
  );

function resolveIcon(props: BucketIconProps) {
  if ('icon' in props) {
    const { icon, ...otherProps } = props;
    return {
      icon,
      otherProps,
    };
  } else if ('bucketHash' in props) {
    const { bucketHash, ...otherProps } = props;
    const icon = getBucketSvgIcon(bucketHash);
    return {
      icon,
      otherProps,
    };
  } else {
    const { itemCategoryHash, ...otherProps } = props;
    return {
      icon: itemCategoryIcons[itemCategoryHash],
      otherProps,
    };
  }
}

/** given an item, returns an img. ideally an svg img icon for the item's bucket */
export default function BucketIcon(props: BucketIconProps) {
  const resolved = resolveIcon(props);
  return resolved.icon ? (
    <img
      src={resolved.icon.svg}
      {...resolved.otherProps}
      className={clsx(props.className, styles.icon, {
        [styles.colorized]: resolved.icon.colorized,
      })}
    />
  ) : (
    <BungieImage src={d2MissingIcon} {...resolved.otherProps} />
  );
}
