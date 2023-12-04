import { d2MissingIcon } from 'app/search/d2-known-values';
import clsx from 'clsx';
import { BucketHashes, ItemCategoryHashes } from 'data/d2/generated-enums';
import React from 'react';
import BungieImage from '../BungieImage';
import styles from './BucketIcon.m.scss';
import { ItemCategoryIcon, getBucketSvgIcon, itemCategoryIcons } from './itemCategory';

type BucketIconProps = React.ImgHTMLAttributes<HTMLImageElement> &
  (
    | {
        icon: ItemCategoryIcon;
      }
    | {
        bucketHash: BucketHashes;
      }
    | {
        itemCategoryHash: ItemCategoryHashes;
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
    return {
      icon: getBucketSvgIcon(bucketHash),
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

/** returns an img corresponding to the specified bucket or item category */
export default function BucketIcon(props: BucketIconProps) {
  const resolved = resolveIcon(props);
  return resolved.icon ? (
    <img
      src={resolved.icon.svg}
      {...resolved.otherProps}
      className={clsx(props.className, styles.icon, {
        dontInvert: resolved.icon.colorized,
      })}
    />
  ) : (
    <BungieImage src={d2MissingIcon} {...resolved.otherProps} />
  );
}
