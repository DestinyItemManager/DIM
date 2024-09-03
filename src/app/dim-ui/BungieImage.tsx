import clsx from 'clsx';
import React, { memo } from 'react';

/**
 * A relative path to a Bungie.net image asset.
 */
export type BungieImagePath = string;

export type BungieImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'onClick'> & {
  src: BungieImagePath;
};

/**
 * An image tag that links its src to bungie.net. Other props pass through to the underlying image.
 */
export default memo(function BungieImage(props: BungieImageProps) {
  const { src, ...otherProps } = props;
  return (
    <img
      src={bungieNetPath(src)}
      loading="lazy"
      {...otherProps}
      className={clsx(otherProps.className, 'no-pointer-events')}
    />
  );
});

/**
 * Produce a style object that sets the background image to an image on bungie.net.
 */
export function bungieBackgroundStyle(src: BungieImagePath) {
  return {
    backgroundImage: `url("${bungieNetPath(src)}")`,
  };
}
/**
 * Produce a style object that sets the background image to an image on bungie.net.
 *
 * Has extra settings because sometimes life throws bad CSS choices your way
 */
export function bungieBackgroundStyleAdvanced(
  src: BungieImagePath,
  additionalBackground?: string,
  stacks = 1,
) {
  const backgrounds = Array(stacks).fill(`url("${bungieNetPath(src)}")`);
  if (additionalBackground) {
    backgrounds.push(additionalBackground);
  }

  return {
    backgroundImage: backgrounds.join(', '),
  };
}

/**
 * Expand a relative bungie.net asset path to a full path.
 */
export function bungieNetPath(src: BungieImagePath): string {
  if (!src) {
    return '';
  }
  if (src.startsWith('~')) {
    return src.substr(1);
  }
  return `https://www.bungie.net${src}`;
}
