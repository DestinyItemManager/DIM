import * as React from 'react';
import * as classNames from 'classnames';
import './StyledBungieImage.scss';
import BungieImage, { BungieImagePath } from './BungieImage';

interface BungieImageProps {
  src: BungieImagePath;
  hash: number;
}

/**
 * A styled BungieImage that overlays additional meta-information.
 */
export default function StyledBungieImage(
  props: BungieImageProps & React.ImgHTMLAttributes<HTMLImageElement>
) {
  const { hash, ...otherProps } = props;

  const styles = classNames(props.className, 'perk-image', {
    'ammo-primary': hash === 143442373,
    'ammo-special': hash === 2620835322,
    'ammo-heavy': hash === 2867719094
  });

  return <BungieImage {...otherProps} className={styles} />;
}
