import * as React from 'react';

/**
 * A relative path to a Bungie.net image asset.
 */
export type BungieImagePath = string;

interface BungieImageProps {
  src: BungieImagePath;
}

/**
 * An image tag that links its src to bungie.net. Other props pass through to the underlying image.
 */
export function BungieImage(props: BungieImageProps) {
  const {src, ...otherProps} = props;
  return <img src={bungieNetPath(src)} {...otherProps} />;
}

/**
 * Produce a style object that sets the background image to an image on bungie.net.
 */
export function bungieBackgroundStyle(src: BungieImagePath) {
  return { backgroundImage: `url(${bungieNetPath(src)})` }
}

/**
 * Expand a relative bungie.net asset path to a full path.
 */
export function bungieNetPath(src: BungieImagePath) {
  return `https://www.bungie.net${src}`;
}