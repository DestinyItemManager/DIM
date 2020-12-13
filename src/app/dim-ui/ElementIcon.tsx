import BungieImage from 'app/dim-ui/BungieImage';
import { DestinyDamageTypeDefinition, DestinyEnergyTypeDefinition } from 'bungie-api-ts/destiny2';
import clsx from 'clsx';
import React from 'react';
import styles from './ElementIcon.m.scss';

export default function ElementIcon({
  element,
  className,
}: {
  element: DestinyDamageTypeDefinition | DestinyEnergyTypeDefinition | null;
  className?: string;
}) {
  const icon = element?.displayProperties?.icon;

  if (!icon) {
    return null;
  }
  return <BungieImage className={clsx(className, styles.element)} src={icon} />;
}
